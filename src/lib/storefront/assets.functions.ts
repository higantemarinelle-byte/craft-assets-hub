// Server functions for Craft Studio asset management.
// All admin-only functions go through requireOwnerAccess.
// resolvePublicAssets is intentionally unauthenticated — it's the read path
// the storefront uses at SSR time to expand Asset IDs into public URLs.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { requireOwnerAccess } from "@/lib/permissions.server";

import {
  CRAFT_ASSETS_BUCKET,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  buildStoragePath,
  sanitizeFilename,
  resolvePublicUrl,
  type AssetSourceType,
  type UsageScope,
} from "./assets";

// ---------------------------------------------------------------------------
// Client factory (server-only helper, used inside handlers).
// ---------------------------------------------------------------------------

function serverPublishableClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// PUBLIC — resolve a supplied list of Asset IDs into safe public shape.
// ---------------------------------------------------------------------------

export const resolvePublicAssets = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()).max(50) }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.ids.length === 0) return { assets: [] as Array<{ id: string; url: string; width: number | null; height: number | null; alt_text: string | null }> };
    const supabase = serverPublishableClient();
    const { data: rows, error } = await supabase
      .from("craft_assets" as any)
      .select("id, bucket, storage_path, width, height, alt_text, status")
      .in("id", data.ids)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return {
      assets: (rows ?? []).map((r: any) => ({
        id: r.id as string,
        url: resolvePublicUrl(r.bucket as string, r.storage_path as string),
        width: (r.width as number | null) ?? null,
        height: (r.height as number | null) ?? null,
        alt_text: (r.alt_text as string | null) ?? null,
      })),
    };
  });

// ---------------------------------------------------------------------------
// ADMIN — assets
// ---------------------------------------------------------------------------

const listInput = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "archived"]).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const adminListAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    let q = (context as any).supabase
      .from("craft_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    else q = q.neq("status", "archived");
    if (data.categoryId) q = q.eq("category_id", data.categoryId);
    if (data.folderId) q = q.eq("folder_id", data.folderId);
    if (data.search && data.search.trim()) {
      const term = `%${data.search.trim()}%`;
      q = q.or(`name.ilike.${term},original_filename.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return {
      assets: (rows ?? []).map((r: any) => ({
        ...r,
        url: resolvePublicUrl(r.bucket, r.storage_path),
      })),
    };
  });

export const adminGetAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { data: row, error } = await (context as any).supabase
      .from("craft_assets")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Asset not found");
    return { asset: { ...row, url: resolvePublicUrl(row.bucket, row.storage_path) } };
  });

/**
 * Reserve an asset row + return the storage path the client should upload to.
 * The browser then uploads the file directly using the user-session Supabase
 * client — RLS on storage.objects enforces owner-only writes.
 */
const reserveInput = z.object({
  name: z.string().min(1).max(200),
  filename: z.string().min(1).max(200),
  mimeType: z.string().refine((m) => (ALLOWED_MIME_TYPES as readonly string[]).includes(m), {
    message: "Unsupported file type",
  }),
  sizeBytes: z.number().int().min(1).max(MAX_FILE_SIZE_BYTES),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  altText: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export const adminReserveAssetUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => reserveInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const userId = (context as any).userId as string;
    // Generate id client-side style by inserting and letting the DB return.
    const path = buildStoragePath(userId, crypto.randomUUID(), data.filename);
    const [ownerId, assetId] = path.split("/");
    const row = {
      id: assetId,
      name: data.name,
      original_filename: sanitizeFilename(data.filename),
      bucket: CRAFT_ASSETS_BUCKET,
      storage_path: path,
      mime_type: data.mimeType,
      size_bytes: data.sizeBytes,
      width: data.width ?? null,
      height: data.height ?? null,
      alt_text: data.altText ?? null,
      category_id: data.categoryId ?? null,
      folder_id: data.folderId ?? null,
      tags: data.tags ?? [],
      status: "active" as const,
      uploaded_by: userId,
    };
    const { data: inserted, error } = await (context as any).supabase
      .from("craft_assets")
      .insert(row)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inserted) throw new Error("Failed to reserve asset row");
    return {
      asset: { ...inserted, url: resolvePublicUrl(inserted.bucket, inserted.storage_path) },
      bucket: CRAFT_ASSETS_BUCKET,
      path,
      ownerId,
    };
  });

const updateInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  altText: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
});

export const adminUpdateAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.altText !== undefined) patch.alt_text = data.altText;
    if (data.categoryId !== undefined) patch.category_id = data.categoryId;
    if (data.folderId !== undefined) patch.folder_id = data.folderId;
    if (data.tags !== undefined) patch.tags = data.tags;
    const { error } = await (context as any).supabase
      .from("craft_assets")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminArchiveAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { error } = await (context as any).supabase
      .from("craft_assets")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRestoreAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { error } = await (context as any).supabase
      .from("craft_assets")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const supa = (context as any).supabase;
    const { data: usage, error: usageErr } = await supa
      .from("craft_asset_usages")
      .select("id")
      .eq("asset_id", data.id)
      .limit(1);
    if (usageErr) throw new Error(usageErr.message);
    if ((usage ?? []).length > 0) {
      throw new Error("Cannot delete: asset is still referenced. Archive it or remove references first.");
    }
    const { data: row } = await supa
      .from("craft_assets")
      .select("bucket, storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row) {
      await supa.storage.from(row.bucket).remove([row.storage_path]);
    }
    const { error } = await supa.from("craft_assets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// ADMIN — usage
// ---------------------------------------------------------------------------

export const adminGetAssetUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { data: rows, error } = await (context as any).supabase
      .from("craft_asset_usages")
      .select("*")
      .eq("asset_id", data.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { usages: rows ?? [] };
  });

const syncInput = z.object({
  scope: z.enum(["draft", "published"]),
  refs: z.array(
    z.object({
      assetId: z.string().uuid(),
      source_type: z.enum([
        "theme",
        "homepage_section",
        "navigation",
        "footer",
        "gallery",
        "campaign",
        "product",
        "other",
      ]),
      source_id: z.string().nullable(),
      field_path: z.string().min(1).max(200),
    }),
  ),
});

/** Replace all usage rows for the given scope with the supplied refs.
 *  Called by theme save (scope='draft') and publish (scope='published'). */
export const adminSyncAssetUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => syncInput.parse(input))
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const supa = (context as any).supabase;
    // Wipe existing rows for scope + source_type='theme' + null source_id.
    // In this phase we only track theme-scoped usage. Future phases pass
    // richer source_id (section id, product id, etc.) and this delete
    // filter will narrow accordingly.
    const scopeTargets = Array.from(new Set(data.refs.map((r) => r.source_type)));
    const deleteTypes = scopeTargets.length ? scopeTargets : ["theme"];
    const { error: delErr } = await supa
      .from("craft_asset_usages")
      .delete()
      .eq("usage_scope", data.scope)
      .in("source_type", deleteTypes);
    if (delErr) throw new Error(delErr.message);
    if (data.refs.length === 0) return { ok: true, added: 0 };
    const rows = data.refs.map((r) => ({
      asset_id: r.assetId,
      source_type: r.source_type,
      source_id: r.source_id,
      field_path: r.field_path,
      usage_scope: data.scope,
      metadata: {},
    }));
    const { error } = await supa.from("craft_asset_usages").upsert(rows, {
      onConflict: "asset_id,source_type,source_id,field_path,usage_scope",
    });
    if (error) throw new Error(error.message);
    return { ok: true, added: rows.length };
  });

// ---------------------------------------------------------------------------
// ADMIN — categories
// ---------------------------------------------------------------------------

export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwnerAccess(context as any);
    const { data, error } = await (context as any).supabase
      .from("craft_asset_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { categories: data ?? [] };
  });

export const adminCreateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
        description: z.string().max(500).nullable().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { error } = await (context as any).supabase.from("craft_asset_categories").insert({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      sort_order: data.sortOrder ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        description: z.string().max(500).nullable().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.sortOrder !== undefined) patch.sort_order = data.sortOrder;
    const { error } = await (context as any).supabase
      .from("craft_asset_categories")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// ADMIN — folders
// ---------------------------------------------------------------------------

export const adminListFolders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireOwnerAccess(context as any);
    const { data, error } = await (context as any).supabase
      .from("craft_asset_folders")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { folders: data ?? [] };
  });

export const adminCreateFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(1).max(80),
        parentId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const { error } = await (context as any).supabase.from("craft_asset_folders").insert({
      name: data.name,
      parent_id: data.parentId ?? null,
      created_by: (context as any).userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateFolder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).max(80).optional(),
        parentId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwnerAccess(context as any);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.parentId !== undefined) patch.parent_id = data.parentId;
    const { error } = await (context as any).supabase
      .from("craft_asset_folders")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Type re-exports for callers.
export type { AssetSourceType, UsageScope };