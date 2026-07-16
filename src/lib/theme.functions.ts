import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireOwnerAccess, requireStaffAccess } from "@/lib/permissions.server";
import { extractAssetRefs } from "@/lib/storefront/asset-usage";
import { mergeTheme } from "@/lib/theme";

async function syncThemeUsage(
  admin: any,
  scope: "draft" | "published",
  draft: unknown,
): Promise<void> {
  const theme = mergeTheme(draft as any);
  const refs = extractAssetRefs(theme);
  // Replace all theme-scoped rows for this scope. Future non-theme sources
  // (products, campaigns) are synced from their own writers.
  await admin
    .from("craft_asset_usages" as any)
    .delete()
    .eq("usage_scope", scope)
    .eq("source_type", "theme");
  if (refs.length === 0) return;
  await admin.from("craft_asset_usages" as any).upsert(
    refs.map((r) => ({
      asset_id: r.assetId,
      source_type: r.source_type,
      source_id: r.source_id,
      field_path: r.field_path,
      usage_scope: scope,
      metadata: {},
    })),
    { onConflict: "asset_id,source_type,source_id,field_path,usage_scope" },
  );
}

function publicClient(): any {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

function serviceClient(): any {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// Public: read published theme JSON for the storefront.
export const getPublishedTheme = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase.from("theme_settings" as any).select("published, published_at").limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return { theme: (data?.published as any) ?? {}, published_at: data?.published_at ?? null };
});

// Staff: read both draft and published.
export const adminGetTheme = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaffAccess(context as any);
    const admin = serviceClient();
    const { data, error } = await admin.from("theme_settings" as any).select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// Owner-only: save draft (Craft Studio is owner-gated).
export const adminSaveThemeDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { draft: any }) => input)
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const admin = serviceClient();
    const { data: row } = await admin.from("theme_settings" as any).select("id").limit(1).maybeSingle();
    if (!row) throw new Error("Theme row missing");
    const { error } = await admin
      .from("theme_settings" as any)
      .update({ draft: data.draft, draft_updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    // Best-effort: don't fail the save if usage tracking table isn't ready.
    try { await syncThemeUsage(admin, "draft", data.draft); } catch (e) { console.warn("syncThemeUsage(draft) failed:", e); }
    return { ok: true };
  });

// Owner-only: publish draft → published, snapshot to versions.
export const adminPublishTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string }) => input)
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const admin = serviceClient();
    const { data: row, error: readErr } = await admin.from("theme_settings" as any).select("*").limit(1).maybeSingle();
    if (readErr || !row) throw new Error(readErr?.message ?? "Theme row missing");
    // Snapshot current published (if any) into versions BEFORE overwriting.
    if (row.published && Object.keys(row.published as any).length) {
      await admin.from("theme_versions" as any).insert({
        snapshot: row.published,
        label: data.label ?? `Auto-snapshot ${new Date().toLocaleString()}`,
        published_by: context.userId,
      });
    }
    const { error } = await admin
      .from("theme_settings" as any)
      .update({ published: row.draft, published_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    try { await syncThemeUsage(admin, "published", row.draft); } catch (e) { console.warn("syncThemeUsage(published) failed:", e); }
    return { ok: true };
  });

// Owner-only: list version history.
export const adminListThemeVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwnerAccess(context as any);
    const admin = serviceClient();
    const { data } = await admin
      .from("theme_versions" as any)
      .select("id, label, created_at, published_by")
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  });

// Owner: revert to a previous published snapshot (loads into draft).
export const adminRevertThemeVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { versionId: string }) => input)
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const admin = serviceClient();
    const { data: v } = await admin.from("theme_versions" as any).select("snapshot").eq("id", data.versionId).maybeSingle();
    if (!v) throw new Error("Version not found");
    const { data: row } = await admin.from("theme_settings" as any).select("id").limit(1).maybeSingle();
    if (!row) throw new Error("Theme row missing");
    await admin
      .from("theme_settings" as any)
      .update({ draft: v.snapshot, draft_updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", row.id);
    return { ok: true };
  });
