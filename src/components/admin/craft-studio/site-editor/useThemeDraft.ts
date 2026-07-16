// Shared draft state for Navigation Builder and Footer Builder (004E).
// Both editors mutate the same Theme JSON. They share hydration, dirty
// tracking, save, publish, unload-warning and query invalidation so the
// two surfaces behave identically.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  adminGetTheme,
  adminPublishTheme,
  adminSaveThemeDraft,
} from "@/lib/theme.functions";
import { mergeTheme, syncLegacyBrandFromTokens, type Theme } from "@/lib/theme";

export function useThemeDraft() {
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetTheme);
  const saveFn = useServerFn(adminSaveThemeDraft);
  const publishFn = useServerFn(adminPublishTheme);

  const { data: row, isLoading, error } = useQuery({
    queryKey: ["theme", "admin"],
    queryFn: () => getFn(),
  });

  const [draft, setDraft] = useState<Theme | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);

  useEffect(() => {
    if (row && !draft) setDraft(mergeTheme((row as any).draft));
  }, [row, draft]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = useMemo(
    () => (fn: (t: Theme) => Theme) => {
      setDraft((prev) => (prev ? fn(prev) : prev));
      setDirty(true);
    },
    [],
  );

  const save = async () => {
    if (!draft || busy) return;
    setBusy("save");
    try {
      const synced = syncLegacyBrandFromTokens(draft);
      await saveFn({ data: { draft: synced } });
      setDraft(synced);
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["theme", "admin"] });
      qc.invalidateQueries({ queryKey: ["theme", "draft"] });
      toast.success("Draft saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save draft");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!draft || busy) return;
    setBusy("publish");
    try {
      if (dirty) {
        const synced = syncLegacyBrandFromTokens(draft);
        await saveFn({ data: { draft: synced } });
        setDraft(synced);
      }
      await publishFn({ data: {} });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["theme", "admin"] });
      qc.invalidateQueries({ queryKey: ["theme", "published"] });
      qc.invalidateQueries({ queryKey: ["theme", "draft"] });
      qc.invalidateQueries({ queryKey: ["theme", "versions"] });
      toast.success("Published live 🎉");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to publish");
    } finally {
      setBusy(null);
    }
  };

  return { draft, setDraft, dirty, busy, isLoading, error, update, save, publish };
}