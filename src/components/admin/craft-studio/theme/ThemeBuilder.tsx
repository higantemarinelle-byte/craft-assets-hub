// Craft Studio Theme Builder — 004D.
// Owner-only visual editor that composes design tokens + preserved content
// controls into a single unified surface with live preview.

import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink,
  History,
  Rocket,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  adminGetTheme,
  adminSaveThemeDraft,
  adminPublishTheme,
  adminListThemeVersions,
  adminRevertThemeVersion,
} from "@/lib/theme.functions";
import { DEFAULT_THEME, mergeTheme, syncLegacyBrandFromTokens, type Theme } from "@/lib/theme";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/storefront/tokens";
import { useAuth } from "@/lib/auth";
import { themeQueryKeys } from "@/lib/theme-query-keys";

import {
  ThemeBrandEditor,
  ThemeColorEditor,
  ThemeTypographyEditor,
  ThemeButtonEditor,
  ThemeLayoutEditor,
  ThemePresetPicker,
} from "./DesignEditors";
import { ThemeContentEditor } from "./ContentEditors";
import { ThemePreviewCanvas } from "./ThemePreviewCanvas";

export function ThemeBuilder() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();

  const getFn = useServerFn(adminGetTheme);
  const saveFn = useServerFn(adminSaveThemeDraft);
  const publishFn = useServerFn(adminPublishTheme);
  const versionsFn = useServerFn(adminListThemeVersions);
  const revertFn = useServerFn(adminRevertThemeVersion);

  const { data: row, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: themeQueryKeys.admin,
    queryFn: () => getFn(),
    retry: false,
  });
  const { data: versions = [] } = useQuery({ queryKey: themeQueryKeys.versions, queryFn: () => versionsFn() });

  const [draft, setDraft] = useState<Theme | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);

  // Hydrate once — do not stomp local edits when the query refreshes.
  // If the theme_settings row is missing (row === null), still hydrate with
  // DEFAULT_THEME so the editor is usable instead of stuck on "Loading…".
  useEffect(() => {
    if (isLoading || draft) return;
    if (row) {
      setDraft(mergeTheme((row as any).draft));
    } else if (!error) {
      setDraft(mergeTheme(undefined));
    }
  }, [row, draft, isLoading, error]);

  // Warn on unload while dirty.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = useMemo(() => (fn: (t: Theme) => Theme) => {
    setDraft((prev) => (prev ? fn(prev) : prev));
    setDirty(true);
  }, []);

  if (isLoading && !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading theme…
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="max-w-lg space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <div className="font-medium text-destructive">Couldn't load theme</div>
        <div className="text-muted-foreground break-words">
          {(error as any)?.message ?? "Unknown error"}
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Retrying…" : "Retry"}
        </Button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing editor…
      </div>
    );
  }

  const save = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const synced = syncLegacyBrandFromTokens(draft);
      await saveFn({ data: { draft: synced } });
      setDraft(synced);
      setDirty(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: themeQueryKeys.admin }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.draft }),
      ]);
      toast.success("Draft saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save draft");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setBusy("publish");
    try {
      if (dirty) {
        const synced = syncLegacyBrandFromTokens(draft);
        await saveFn({ data: { draft: synced } });
        setDraft(synced);
      }
      await publishFn({ data: {} });
      setDirty(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: themeQueryKeys.admin }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.published, refetchType: "all" }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.draft }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.versions }),
      ]);
      toast.success("Published live 🎉");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to publish");
    } finally {
      setBusy(null);
    }
  };

  const revert = async (versionId: string) => {
    try {
      await revertFn({ data: { versionId } });
      const fresh: any = await getFn();
      setDraft(mergeTheme(fresh?.draft));
      setDirty(false);
      await qc.invalidateQueries({ queryKey: themeQueryKeys.admin });
      toast.success("Loaded version into draft");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load version");
    }
  };

  const resetAllDesign = () => {
    if (!window.confirm("Reset ALL design tokens (colours, typography, buttons, layout) to defaults? Content stays untouched.")) return;
    update((t) => ({ ...t, tokens: DEFAULT_DESIGN_TOKENS }));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">Theme Builder</h1>
          <p className="text-sm text-muted-foreground">
            Craft Studio · Visual storefront design
            {dirty && <span className="ml-2 rounded bg-yellow px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-ink">Unsaved</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={save} disabled={!dirty || busy !== null}>
            {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save draft
          </Button>
          <a href="/?theme=draft" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-4 py-2 text-sm font-bold hover:bg-yellow">
            <ExternalLink className="h-4 w-4" /> Full preview
          </a>
          {isOwner && (
            <Button onClick={publish} disabled={busy !== null} className="bg-magenta text-cream hover:bg-magenta/90">
              {busy === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Settings panel */}
        <div className="rounded-lg border-2 border-ink bg-cream p-4">
          <Tabs defaultValue="brand">
            <TabsList className="mb-4 flex w-full flex-wrap gap-1 bg-ink/5">
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="colors">Colours</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="brand"><ThemeBrandEditor theme={draft} update={update} /></TabsContent>
            <TabsContent value="colors"><ThemeColorEditor theme={draft} update={update} /></TabsContent>
            <TabsContent value="typography"><ThemeTypographyEditor theme={draft} update={update} /></TabsContent>
            <TabsContent value="buttons"><ThemeButtonEditor theme={draft} update={update} /></TabsContent>
            <TabsContent value="layout">
              <ThemeLayoutEditor theme={draft} update={update} />
              <div className="mt-6 border-t border-ink/10 pt-4">
                <Button variant="outline" size="sm" onClick={resetAllDesign}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset ALL design tokens
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="presets"><ThemePresetPicker update={update} onApply={() => toast.success("Preset applied — remember to save")} /></TabsContent>
            <TabsContent value="content" className="space-y-4">
              <p className="rounded border-2 border-ink/20 bg-yellow/40 p-3 text-xs">
                Existing storefront content controls — announcements, homepage, navigation, footer, pages and inventory. These will move into dedicated Craft Studio modules in later engineering tasks.
              </p>
              <ThemeContentEditor theme={draft} update={update} />
            </TabsContent>
            <TabsContent value="history">
              <VersionPanel versions={versions as any[]} onRevert={revert} isOwner={isOwner} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview panel */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <ThemePreviewCanvas theme={draft} />
        </div>
      </div>
    </div>
  );
}

function VersionPanel({ versions, onRevert, isOwner }: { versions: any[]; onRevert: (id: string) => void; isOwner: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
        <History className="h-4 w-4" /> Version history
      </div>
      {versions.length === 0 && <p className="text-xs text-muted-foreground">No previous versions. Publishing snapshots the current live theme.</p>}
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="rounded border-2 border-ink/20 p-2 text-xs">
            <div className="font-semibold">{v.label ?? "Snapshot"}</div>
            <div className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
            {isOwner && (
              <button className="mt-1 text-magenta hover:underline" onClick={() => onRevert(v.id)}>Load into draft</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Silence "DEFAULT_THEME unused" if a future edit removes references.
void DEFAULT_THEME;