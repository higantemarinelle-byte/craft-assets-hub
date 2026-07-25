## Repair Pre-made Product editor

### Root causes (confirmed from reads)

1. **Silent partial saves** — `adminSaveProduct` (`src/lib/admin.functions.ts`) never checks `error` on variant `update`/`insert`/`delete`. A failed variant leaves the parent product updated and reports success.
2. **Weak edit route** (`products.$id.tsx`) — no error UI, no retry; `!data` collapses "not found" and "fetch error" into the same message.
3. **Form gaps** (`ProductForm.tsx`) — images are a raw textarea of URLs (no MediaPicker), no Status (Active/Archived), no Save-and-continue, no Cancel with unsaved-changes guard, no Preview. Label reads "Featured / best-seller" instead of "Show in Popular Designs".
4. **Inconsistent query keys** — admin uses `["admin:products"]`, storefront uses different keys, so save invalidations don't refresh the edit view or the public shop.

### Scope

Catalog code only. No DB migration. No changes to Projects, Cart, Craft Studio, Theme, Gang Sheet, or Asset Manager internals. Archived = existing `is_published=false` + `archived` tag.

### Changes

- **`src/lib/admin.functions.ts`**
  - Rewrite `adminSaveProduct`: check every Supabase error, abort on first failure, return `{ id, variants }`.
  - `adminGetProduct`: return `null` on not-found, throw with message on error.
  - Keep existing `serviceClient()`/`assertStaff` usage (no auth refactor this pass).

- **`src/routes/_authenticated/portal-admin/products.$id.tsx`**
  - Loading state, error state with **Retry**, explicit "Product not found" vs error.
  - Query key `["admin","catalog","product", id]`.

- **`src/routes/_authenticated/portal-admin/products.tsx`**
  - Title → **"Pre-made Products"**.
  - Query keys → `["admin","catalog","products"]`, `["admin","catalog","categories"]`.
  - After save/toggle/reorder invalidate admin keys AND storefront keys (`["catalog","products"]`, `["catalog","featured"]`, `["catalog","product", slug]`).

- **`src/routes/_authenticated/portal-admin/products.new.tsx`**
  - Route to edit page after create (enables Save-and-continue on new).

- **`src/components/admin/ProductForm.tsx`** (bulk of the UX work)
  - Replace images textarea with **MediaPicker** — primary + gallery, reorder, remove. Store Asset IDs as `asset:<uuid>` in existing `images text[]`; legacy URL strings continue to work.
  - Rename toggle to **"Show in Popular Designs"** with helper text.
  - Add **Status** control (Active / Archived): Archived sets `is_published=false` and appends `archived` tag; Active removes it.
  - Variants: validation, ↑/↓ reorder, delete guard, persistent `sort_order`.
  - Buttons: **Save**, **Save and Continue Editing**, **Cancel** (unsaved-changes confirm), **Preview** (opens `/shop/{slug}` in new tab; disabled while dirty or unpublished).
  - `beforeunload` guard when the form is dirty.
  - Invalidate all admin + storefront catalog keys on save.

- **`src/components/site/ProductCard.tsx`, `src/routes/shop.$slug.tsx`, `src/routes/shop.tsx`**
  - When an image entry starts with `asset:`, render via `StorefrontAssetImage`; otherwise use the URL as today. Additive only.

### Verification (before claiming done)

1. Build + lint.
2. Manual on an existing product: edit name/description/category/price → add/edit/delete a variant → pick an image via Media Picker → **Save and Continue Editing** → refresh → confirm persistence → view `/shop` and `/shop/{slug}` → toggle **Archived** → confirm hidden from `/shop` and Popular Designs → toggle back → confirm reappears.
3. Force a variant error and confirm the save reports failure (no false success toast).

### Out of scope

No DB migration, no auth-helper refactor, no changes to Projects/Cart/Craft Studio/Theme/Gang Sheet/Asset Manager internals, no new upload pipeline.
