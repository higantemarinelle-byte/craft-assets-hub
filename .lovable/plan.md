# Fix: Pre-made Products cannot be opened, edited, or created

## What I verified first

Live database (queried directly, not the generated types):

- `products` has all expected columns: id, slug, name, description, care_instructions, category_id, base_price, images, tags, is_featured, is_published, sort_order, created_at, updated_at.
- `product_variants` has: id, product_id, label, price, stock, sort_order, created_at.
- `categories` has: id, slug, name, description, sort_order, image_url, accent.
- Real product rows exist (e.g. "Custom Artwork Tee", "Press Play Tee").
- Table privileges for anon/authenticated/service_role are present on products, product_variants, categories, profiles, user_roles.
- Both owner accounts have the `owner` role, and `has_role` is still executable by `authenticated`, so the role lookup used by the permission helpers is not blocked.

So there is no schema mismatch and no missing migration. The failure is in application code, not the database.

## Root cause (to be confirmed by a live signed-in test as step 1 of the work)

`src/lib/admin.functions.ts` declares server functions **and** module-scope runtime code in the same file: the `getStaffAdmin()` helper, `uuidSchema`, `productSchema`, `discountSchema`, `categorySchema`. TanStack's server-function splitting plugin extracts handler bodies into a separate server bundle and strips runtime siblings from the module. Handlers that call `getStaffAdmin(...)` then hit a missing binding at runtime — the request fails before any query runs, while typecheck and build both pass. This matches the observed behaviour exactly: list/edit/new all hang or fail with nothing useful surfacing.

A second, compounding problem: the `errorMiddleware` in `src/start.ts` is a **request** middleware and wraps server-function RPC requests too. Any thrown error is converted into an HTML 500 page, which the client RPC layer cannot parse — so a real error becomes an endless "Loading product…" instead of a readable message.

## The fix

1. **Make `admin.functions.ts` a thin wrapper.**
   - New `src/lib/admin.server.ts`: `getStaffAdmin()` (permission check + centralized `supabaseAdmin` from `src/integrations/supabase/client.server.ts`). No change to the auth model.
   - New `src/lib/admin.schemas.ts`: the Zod schemas (client-safe).
   - `admin.functions.ts` keeps only imports and `createServerFn` declarations.
   - No change to `requireSupabaseAuth`, `requireStaffAccess`, `requireOwnerAccess`, or the owner allowlist. Admin functions stay authenticated.

2. **Stop the error middleware from mangling server-function errors.**
   In `src/start.ts`, let requests to the server-function RPC path fall through with their normal serialized error instead of being replaced by the HTML error page. The friendly full-page error handling stays for real SSR/page crashes.

3. **Remove the temporary diagnostics** added in the previous attempt: the 15-second race/timeout and the 8-second "taking longer than usual" panel in `src/routes/_authenticated/portal-admin/products.$id.tsx`, and the extra `console.error` wrappers in `adminGetProduct`. A normal loading state plus a real error state with Retry remains.

## Verification before I report back

Signed in as an owner against the running app (browser automation), I will:

- Open `/portal-admin/products` — list renders with category, stock, and order.
- Open an existing product, change a field, save, hard-refresh, confirm the change persisted.
- Add, edit, and remove a variant on that product and confirm each persists.
- Create a new product at `/portal-admin/products/new` with a unique slug and one variant, confirm it appears in the list, reopens for edit, and survives refresh; remove the test record afterwards.
- Confirm `/portal-admin/categories` returns real categories.
- Run build and lint.

I will report: root cause, files changed, whether any migration was needed (currently: none), existing-product test result, new-product test result, refresh-persistence result, build result, lint result.

## Out of scope

No redesign of ProductForm. No changes to Projects, Project Cart, Theme Builder, Asset Manager, Gang Sheet Builder, or the Customer Portal. No checkout or payment processing. No new diagnostic UI.
