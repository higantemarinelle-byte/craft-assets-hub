# Craft Studio Repair — Real Status + Shopify-Style Theme Editor

## Why "Never updated" appears

The Craft Studio dashboard renders a hardcoded constant. `src/routes/_authenticated/portal-admin/craft-studio.tsx` passes `DEFAULT_STOREFRONT_STATUS` (from `src/lib/craft-studio.ts`, with `lastPublished: null`, `lastUpdated: null`, `draftStatus: "no_draft"`) straight into `StatusPanel`, and `CRAFT_MODULES` entries carry no `lastUpdated`. `ModuleCard.tsx` prints "Never updated" whenever that field is missing. Nothing on the page ever queries `theme_settings` or `craft_assets`, so real activity can never show.

## 1. Real dashboard status server function

New `src/lib/craft-studio.functions.ts` — owner-only, `requireSupabaseAuth` middleware + `requireOwnerAccess`, dynamic import of the centralized `supabaseAdmin` inside the handler (same pattern as `theme.functions.ts`). No new migration.

Reads the single `theme_settings` row (`draft`, `published`, `draft_updated_at`, `published_at`, `updated_at`) plus the newest `craft_assets.updated_at/created_at`, and the latest `theme_versions.created_at`. Returns:

- `storefront`: live when a non-empty `published` exists, else offline
- `hasUnpublishedChanges`: deep JSON comparison of `draft` vs `published` (not timestamp presence)
- `draftUpdatedAt`, `publishedAt`, `updatedAt`, `assetsUpdatedAt`, `lastVersionAt`
- `themeName`: `draft.brand.name` / preset label when available

## 2. Status panel uses live data

`craft-studio.tsx` fetches via `useQuery` with key `["craft-studio","dashboard"]` and passes results into `StatusPanel`. `StatusPanel` shows Live/Offline, "Draft pending" vs "No unpublished changes", real published/updated timestamps formatted as `Updated 24 Aug 2026, 7:30 AM` with relative text ("12 minutes ago") and the exact date in a `title` tooltip, plus the real theme name. `DEFAULT_STOREFRONT_STATUS` is used only as a loading skeleton value, not as displayed truth.

## 3. Real module timestamps

Module descriptors stop carrying `lastUpdated`. The dashboard maps live timestamps per module: theme-backed modules (Homepage, Theme, Navigation, Footer, Announcement, Drafts, Publish) use `draft_updated_at` / `published_at`; Media Library uses the latest `craft_assets` timestamp. "Never updated" only renders when the resolved timestamp is genuinely null.

## 4. Corrected module statuses

Homepage, Announcement Bar, Drafts and Publish become `available` with working links (see §10). Gallery, SEO and Campaigns stay Coming Soon since no working UI exists for them.

## 5. Shopify-style Theme Builder layout

Refactor only `ThemeBuilder.tsx` (plus small new presentational files under `theme/`) into a two-column customizer: persistent top toolbar, left editor sidebar, right live `ThemePreviewCanvas` (sticky). Sidebar groups:

```text
Header · Announcement
Homepage
  Hero · Marquee · Categories · Popular Designs · How it works · Testimonials
Footer
Theme settings
  Brand · Colours · Typography · Buttons · Layout · Presets
Version history
```

All existing editors (`ThemeBrandEditor`, `ThemeColorEditor`, `ThemeTypographyEditor`, `ThemeButtonEditor`, `ThemeLayoutEditor`, `ThemePresetPicker`, `ThemeContentEditor`, `ThemePreviewCanvas`) are reused as panel bodies; no backend, storage or save/publish logic changes.

## 6–7. Homepage section list and drill-in

Homepage panel lists `theme.home.sections` with enable/disable eye toggle and reorder (existing `SectionsEditor` logic; Move Up/Down as accessible fallback). Clicking a section swaps the sidebar to that section's fields — Hero shows eyebrow, both headline lines and highlights with their independent colour pickers, body, both CTAs and links, hero image via MediaPicker — with a Back action returning to the section list. Preview updates live from local draft state, as today.

## 8. Persistent Save / Publish header

Toolbar always visible: status text (`Unsaved changes` / `Draft saved` / `Live · Published just now`), Save Draft (disabled when clean), Full preview, Publish (saves first when dirty).

## 9. Dashboard refresh after save/publish

Save and Publish additionally invalidate `["craft-studio","dashboard"]`, so returning to Craft Studio shows updated status with no hard refresh.

## 10. Direct module links

`ThemeBuilder` reads a validated `panel` search param on `/portal-admin/theme` (`homepage | theme | announcement | draft | history`, unknown values fall back to Homepage) and selects the matching sidebar panel. Module cards link accordingly. Navigation and Footer keep their existing dedicated builders.

## 11. Preserved

No changes to theme storage, save/publish/version backends, Navigation/Footer builders, Media Library, Projects, Products, Gang Sheet, Customer Portal or the Craft OS sidebar. No new tables, no migration, no payments.

## 12. Verification

Playwright run with an owner session: record dashboard status → edit Hero text → Save Draft → dashboard shows Draft pending and a fresh Last updated with no "Never updated" → Publish → dashboard shows No unpublished changes and fresh Last published → Homepage card opens directly to Homepage editing → hero edit and section reorder reflect in preview → refresh persists → public storefront shows published content. Then build and lint, reporting both results.

## Files touched

- new `src/lib/craft-studio.functions.ts`
- `src/lib/craft-studio.ts` (status type, module statuses/hrefs, drop static timestamps)
- `src/routes/_authenticated/portal-admin/craft-studio.tsx`
- `src/components/admin/craft-studio/StatusPanel.tsx`, `ModuleCard.tsx`
- `src/components/admin/craft-studio/theme/ThemeBuilder.tsx` (+ new sidebar/panel components)
- `src/routes/_authenticated/portal-admin/theme.tsx` (search param validation)
- `src/lib/theme-query-keys.ts` (dashboard key)
