import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

async function assertStaff(ctx: any, ownerOnly = false) {
  const admin = serviceClient();
  const { data } = await admin.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (ownerOnly) {
    if (!roles.includes("owner")) throw new Error("Forbidden");
  } else {
    if (!roles.includes("owner") && !roles.includes("employee")) throw new Error("Forbidden");
  }
  return { admin, roles };
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
    const { admin } = await assertStaff(context);
    const { data, error } = await admin.from("theme_settings" as any).select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

// Staff: save draft.
export const adminSaveThemeDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { draft: any }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { data: row } = await admin.from("theme_settings" as any).select("id").limit(1).maybeSingle();
    if (!row) throw new Error("Theme row missing");
    const { error } = await admin
      .from("theme_settings" as any)
      .update({ draft: data.draft, draft_updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Owner-only: publish draft → published, snapshot to versions.
export const adminPublishTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context, true);
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
    return { ok: true };
  });

// Staff: list version history.
export const adminListThemeVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
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
    const { admin } = await assertStaff(context, true);
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
