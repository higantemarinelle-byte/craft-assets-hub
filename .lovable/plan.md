
# Engineering Task 004C — Asset Manager, Design Tokens, Storefront Assets

## Phase 0 — Import repo into this Lovable project

The Lovable project is currently a blank TanStack Start template. Before Task 004C work begins:

1. Extract `user-uploads://color-canvas-studio-main.zip` to `/tmp` and confirm no `.git` metadata is copied.
2. Sync files into `/dev-server` with `rsync --exclude='.git'` (preserves this project's git state).
3. Install dependencies (`bun install`) so the auto-build sees the new tree.
4. Enable Lovable Cloud only if it isn't already wired; the repo already has `src/integrations/supabase/*`, so most likely we just need to confirm env + types.
5. Verify the app builds and the existing Craft Studio + Homepage Builder routes render before making any 004C changes.

No feature work happens until Phase 0 is green.

## Phase 1 — Centralized owner permissions

- New `src/lib/permissions.server.ts` exporting `requireStaffAccess`, `requireOwnerAccess`, `requireOwnerCapability`.
  - Each helper takes the `requireSupabaseAuth` context, loads the user's role from `user_roles`, checks the email allowlist already defined in `src/lib/permissions.ts`, and throws a typed `ForbiddenError` (returned as `Response('Forbidden', { status: 403 })`).
- Refactor every Craft Studio server function in `src/lib/theme.functions.ts` (draft read/save, publish, version history, revert) to use `requireOwnerAccess`. Keep the public published-theme reader open (no auth middleware).
- Draft preview route on the storefront gated by the same helper via a server fn call.

## Phase 2 — Supabase schema (new migration)

One additive migration file under `supabase/migrations/` creating:

- `craft_asset_categories` (id, name, slug unique, description, sort_order, timestamps) + seed rows: Brand Assets, Logos, Hero Images, Homepage Images, Gallery, Campaign Assets, Icons, Product Collections, General.
- `craft_asset_folders` (id, name, parent_id nullable self-ref, created_by, timestamps).
- `craft_assets` (id, name, original_filename, bucket, storage_path unique, mime_type, size_bytes, width, height, alt_text, category_id, folder_id, tags text[], status text default 'active' check in ('active','archived'), uploaded_by, timestamps).
- `craft_asset_usages` (id, asset_id fk → craft_assets on delete cascade, source_type, source_id, field_path, usage_scope check in ('draft','published'), metadata jsonb, timestamps) + unique index `(asset_id, source_type, source_id, field_path, usage_scope)`.

For every new public-schema table:

- `GRANT SELECT` to `anon` on `craft_assets` + `craft_asset_categories` + `craft_asset_folders` (storefront needs to resolve public URLs).
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` and `GRANT ALL ... TO service_role`.
- Enable RLS. Policies:
  - `craft_assets`: anon `SELECT` where `status = 'active'`; authenticated full access filtered through `has_role(auth.uid(), 'owner')` (Craft Studio-only writes). Same shape for categories/folders/usages (owner-only writes; usages readable only to owners).

Nothing existing is dropped or altered.

## Phase 3 — Supabase Storage bucket

Create bucket `craft-studio-assets` via `supabase--storage_create_bucket` (public read). Policies on `storage.objects`:

- Public `SELECT` for `bucket_id = 'craft-studio-assets'`.
- INSERT/UPDATE/DELETE only when `has_role(auth.uid(), 'owner')` AND caller email in the allowlist (via a SECURITY DEFINER helper `public.is_craft_owner(uuid)`).
- Object paths: `{ownerUserId}/{assetId}/{sanitizedFilename}` — generated server-side.
- Server-side validation: MIME in {png,jpeg,jpg,webp,gif,avif}, size ≤ 15 MB. SVG deferred.

## Phase 4 — Storefront services (`src/lib/storefront/`)

New folder — existing `src/lib/theme.ts` / `theme.functions.ts` untouched except for Asset ID additions.

- `assets.ts` — client-safe types (`CraftAsset`, `CraftAssetCategory`, `CraftAssetFolder`, `CraftAssetUsage`, `AssetUploadInput`, `AssetUpdateInput`, `AssetPickerValue`), pure helpers: `validateMimeType`, `validateSize`, `sanitizeFilename`, `buildStoragePath`, `readImageDimensions` (browser only), `resolvePublicUrl(bucket, path)`.
- `assets.functions.ts` — server functions, all owner-gated except the public resolver:
  - `listAssets`, `searchAssets`, `getAsset`, `createAsset` (metadata after upload), `updateAsset`, `archiveAsset`, `restoreAsset`, `deleteAsset` (blocked if usages exist), `getAssetUsage`.
  - `listCategories`, `createCategory`, `updateCategory`.
  - `listFolders`, `createFolder`, `updateFolder`.
  - `resolvePublicAssets({ ids: string[] })` — no auth; returns only `{id, url, width, height, alt_text}` for `status='active'` rows.
  - Uploads happen client-side via the browser Supabase client into the bucket after `createAsset` reserves the row + path; the server fn returns the signed upload target. Replace flow: upload new object under same asset id folder, update row, delete old object.
- `asset-usage.ts` — pure functions: `extractAssetRefs(theme)`, `diffUsage(prev, next)`, `syncDraftUsage(assetRefs)`, `syncPublishedUsage(assetRefs)`. Initial tracked fields: `brand.logoAssetId`, homepage hero section `image.assetId`. Structure allows adding gallery/section/nav/footer/product later.
- `tokens.ts` — typed design token schema (color, typography, radius, spacing) + `tokensToCssVariables(tokens)` returning a `Record<string,string>` mapped to the existing `--color-*` / `--radius-*` vars in `src/styles.css`. Consumer: `theme-context.tsx` will inject a `<style>` tag with the token vars scoped to `:root`. No visual regression: defaults mirror current tokens.
- `index.ts` — re-exports.

## Phase 5 — Asset IDs in the existing theme

- Extend `ThemeConfig` in `src/lib/theme.ts`:
  - `brand.logoAssetId: string | null` (add), keep `brand.logoUrl` optional for backward compatibility.
  - Homepage hero section: add `image.assetId: string | null` alongside existing `image.url`.
- Theme resolver: if `logoAssetId` set, resolve URL via `resolvePublicAssets`; else fall back to `logoUrl`. Same rule for hero image.
- Migration for existing drafts: no data migration required — legacy URL fields keep working.
- `theme.functions.ts` save/publish handlers call `syncDraftUsage` / `syncPublishedUsage` after write.

## Phase 6 — Media Picker + Asset Manager UI

- `src/components/admin/craft-studio/MediaPicker.tsx` — dialog with tabs (Library / Upload / URL fallback), category + folder filters, search, returns `AssetPickerValue`. Reused by future editors.
- `src/routes/_authenticated/portal-admin/craft-studio.assets.tsx` — Asset Manager page (list, grid, filters, upload, edit metadata, archive/restore, delete-if-unused, usage panel). Owner-gated via existing `_authenticated` layout + Craft Studio route wrapper.
- Wire MediaPicker into existing Logo and Hero editors on `craft-studio.tsx` (or the sub-route where they live) — only surfaces where Asset IDs are already in scope for Phase 5.

## Phase 7 — Verify

- `bun run build` (auto).
- Manual: sign in as owner → open Asset Manager → upload → assign to hero → save draft → preview → publish → confirm asset URL resolves on storefront and usage row appears with `scope='published'`.
- Non-owner login gets 403 from every Craft Studio fn.

## Out of scope (deferred to 004D+)

- Theme Builder UI for design tokens (only the token architecture + CSS var wiring lands here).
- Nested folder tree UI (schema supports it; UI is flat for now).
- Navigation, footer, gallery, campaign, product asset references (architecture ready; wiring later).
- AI actions.
- Version history changes.

## Technical details

- All new server fns follow `createServerFn().middleware([requireSupabaseAuth]).inputValidator(zod).handler(...)` with permission helper invoked first in the handler.
- Storage writes from the browser use the user-session `supabase` client so RLS on `storage.objects` enforces the owner check — no service-role usage from client-reachable code.
- `resolvePublicAssets` uses a server publishable client (per stack rules) so SSR works without a bearer token.
- No changes to `src/routes/_authenticated/route.tsx` (integration-managed).

