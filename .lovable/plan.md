# Engineering Task 004D — Theme Builder

Build a complete visual Theme Builder for Craft Studio on top of the existing token foundation, without any DB migration and without disturbing Projects, Assets (004C), Homepage Builder (004B), or the publishing workflow.

## Approach

1. **Expand tokens** (`src/lib/storefront/tokens.ts`)
   - New `StorefrontDesignTokens` (colors, typography, buttons, radius, spacing).
   - Defaults reproduce current Craft & Cling look (ink/cream/CMYK).
   - Export `DEFAULT_DESIGN_TOKENS`, `mergeDesignTokens`, `designTokensToCssVariables`, plus back-compat aliases (`DesignTokens`, `DEFAULT_TOKENS`, `tokensToCssVariables`).

2. **Theme model** (`src/lib/theme.ts`)
   - Add `tokens: StorefrontDesignTokens` to `Theme`.
   - `mergeTheme` deep-merges tokens; when tokens missing, seed `tokens.colors.primary/accent` from legacy `brand.primary/accent`.
   - On save, keep `brand.primary/accent` synced from tokens for back-compat.

3. **Validation** (`src/lib/storefront/tokens.validation.ts`)
   - Zod schema; reject `url(`, `expression(`, `<script`, `;`, `{}`, remote URLs. Enum for button style, controlled font IDs, controlled radius/spacing tokens.
   - Server-side `adminSaveThemeDraft` / `adminPublishTheme` validate before write.

4. **Font registry** (`src/lib/storefront/fonts.ts`)
   - Controlled list: Space Grotesk, DM Sans, Inter, Poppins, Montserrat, Lora, Playfair Display, System Sans, System Serif.
   - Load selected Google Fonts via `<link>` in `__root.tsx` head based on published theme.

5. **CSS variable runtime**
   - `theme-context.tsx` injects `<style>` with token → CSS-var mapping, scoped to `.storefront-theme`.
   - Map new tokens to legacy vars (`--ink`, `--cream`, `--cmyk-*`) so existing utilities respond.
   - Wrap storefront (public routes + storefront preview) in `StorefrontThemeScope`; do NOT apply to `/portal-admin/*`.

6. **Owner-only server functions** (`src/lib/theme.functions.ts`)
   - Switch `adminGetTheme`, versions listing/revert to `requireOwnerAccess`.
   - Draft preview gate in `theme-context.tsx` uses owner check (via existing permissions).

7. **Theme Builder UI** — refactor `src/routes/_authenticated/portal-admin/theme.tsx` into thin route + `src/components/admin/craft-studio/theme/*`:
   - `ThemeBuilder`, `ThemeBuilderHeader` (save/publish/preview/version), `ThemeSettingsPanel` (tabs: Brand, Colors, Typography, Buttons, Layout, Presets, Content), `ThemePreviewCanvas` + `ThemeDeviceSwitcher`, `ThemePresetPicker`, per-section editors, `ColorTokenField`, `FontSelector`, `TokenResetButton`, `ThemeVersionPanel`.
   - Existing announcement/homepage/nav/footer/pages/inventory controls preserved under a "Content" tab.

8. **Presets** (in `tokens.ts`): Craft & Cling Default, Bold CMYK, Soft Craft, Minimal Ink. Apply only touches `tokens`, never content/assets.

9. **Preview canvas**
   - In-page div, `.storefront-theme` scope with token style attribute from local unsaved draft. Renders announcement bar, header, nav, hero, buttons, card, form field, badge, footer sample. Device widths: 1280 / 834 / 390.

10. **Media Picker integration**
    - Brand logo + hero via existing `MediaPicker`; store `logoAssetId` / `imageAssetId`, keep legacy URL fallback.
    - New `src/components/site/StorefrontAssetImage.tsx` — resolves Asset ID via existing public resolver with TanStack Query; falls back to legacy URL.
    - Update `Header.tsx` and `routes/index.tsx` to use it.

11. **Storefront wiring**
    - Wrap storefront in `StorefrontThemeScope` (from `__root.tsx` for non-admin routes, or per-layout).
    - Header/Footer/AnnouncementBar/ProductCard/Marquee reviewed to consume tokens via existing utility classes (already token-driven through legacy var mapping).

12. **Query keys & dirty state**
    - Keys: `["theme","admin"]`, `["theme","published"]`, `["theme","versions"]`, `["storefront-assets", id]`.
    - Local draft state independent of query cache; dirty flag; `beforeunload` warning; scoped invalidations after save/publish.

13. **Full draft preview**
    - `/?theme=draft` continues; gate switches from `isStaff` to owner check.

## Technical Notes

- No SQL migration.
- No new tables or buckets.
- Legacy `brand.primary/accent`, `logoUrl`, `imageUrl` preserved as fallbacks.
- Admin UI is NOT wrapped in `.storefront-theme` scope; keeps shadcn defaults.
- Fonts loaded via `<link rel="stylesheet">` in root head, built from published theme's font IDs (registry-controlled).
- Zod validation shared between client (form) and server (functions).

## Out of Scope

Navigation/Footer builder redesign, Publishing engine redesign, AI, custom CSS, payments, product changes.

## Verification

- Production build (`bun run build` or project script).
- Manual checklist:
  1. `/portal-admin/theme` loads for owner, denied for non-owner.
  2. Color/font/radius/button/layout edits reflect immediately in preview canvas.
  3. Save → reopen, values persist.
  4. Publish → storefront `/` reflects changes; `--ink/--cream/--cmyk-*` respond.
  5. Preset applies to tokens only; content untouched.
  6. Reset field / section / all works.
  7. Unsaved-changes navigation warning fires.
  8. Media Picker sets logo/hero Asset ID; `StorefrontAssetImage` renders it; legacy URL still works when no ID.
  9. Admin pages (Projects, Assets) unaffected by storefront theme.
  10. `/?theme=draft` shows draft only for owner.
  11. Version revert loads snapshot into draft; old snapshots without tokens still work.
