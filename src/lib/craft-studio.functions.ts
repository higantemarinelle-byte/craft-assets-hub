// Craft Studio dashboard status — real data, no hardcoded timestamps.
// Owner-only. Reads theme_settings + craft_assets + theme_versions.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireOwnerAccess } from "@/lib/permissions.server";

export type CraftStudioDashboardStatus = {
  storefront: "live" | "offline";
  hasUnpublishedChanges: boolean;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  assetsUpdatedAt: string | null;
  lastVersionAt: string | null;
  themeName: string;
};

export const adminGetCraftStudioStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CraftStudioDashboardStatus> => {
    await requireOwnerAccess(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { stableStringify } = await import("@/lib/craft-studio.server");

    const { data: row, error } = await supabaseAdmin
      .from("theme_settings" as any)
      .select("draft, published, draft_updated_at, published_at, updated_at")
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[adminGetCraftStudioStatus] theme_settings error:", error.message);
      throw new Error("Could not load Craft Studio status");
    }

    const draft = (row as any)?.draft ?? {};
    const published = (row as any)?.published ?? {};
    const publishedIsEmpty = !published || Object.keys(published).length === 0;

    let assetsUpdatedAt: string | null = null;
    try {
      const { data: asset } = await supabaseAdmin
        .from("craft_assets" as any)
        .select("updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      assetsUpdatedAt = (asset as any)?.updated_at ?? (asset as any)?.created_at ?? null;
    } catch {
      assetsUpdatedAt = null;
    }

    let lastVersionAt: string | null = null;
    try {
      const { data: version } = await supabaseAdmin
        .from("theme_versions" as any)
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastVersionAt = (version as any)?.created_at ?? null;
    } catch {
      lastVersionAt = null;
    }

    return {
      storefront: publishedIsEmpty ? "offline" : "live",
      hasUnpublishedChanges: publishedIsEmpty
        ? Object.keys(draft ?? {}).length > 0
        : stableStringify(draft) !== stableStringify(published),
      draftUpdatedAt: (row as any)?.draft_updated_at ?? null,
      publishedAt: (row as any)?.published_at ?? null,
      updatedAt: (row as any)?.updated_at ?? null,
      assetsUpdatedAt,
      lastVersionAt,
      themeName:
        (draft as any)?.brand?.name?.trim?.() ||
        (published as any)?.brand?.name?.trim?.() ||
        "Craft & Cling",
    };
  });
