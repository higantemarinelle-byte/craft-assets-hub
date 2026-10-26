# Critical Craft Studio Repair — Publish must reach the live storefront

## What has been checked so far
- The database is updating: `draft_updated_at` (11:57:22) and `published_at` (11:57:34 today) both moved, and the draft and published copies both contain `navigation`. Publishing to the database already works.
- `getPublishedTheme()` catches every error and returns `{ theme: {}, published_at: null }`. Visitors then quietly see the default theme. This is the silent fallback described in the brief.
- Confirmed mismatch: in the Theme Builder, the "Header / navigation" panel uses `ThemeLegacyNavEditor` (writes `theme.nav`) and the "Footer content" panel uses `ThemeLegacyFooterEditor` (writes `theme.footer`). The live Header reads `theme.navigation` and the live Footer reads `theme.footerV2`, so edits in those panels never show up.
- The Publish toast ("Published live") appears without checking that the public reader sees the new version.

## Fixes

1. **Make read failures visible in `getPublishedTheme`.** Keep the centralized admin client and select only `published, published_at`. Return `{ status: "ok" | "empty" | "error", theme, published_at }`. Log only the safe Supabase error message and code. Set `Cache-Control: no-store` on the response.
2. **ThemeProvider.** Expose `publishedStatus` and `publishedAt`. It still falls back to defaults so visitors see a working page, but an `error` is logged to the console and is no longer treated as "no theme". Keep the existing published/draft split and query key, and keep staleTime 0, refetchOnMount "always", refetchOnWindowFocus.
3. **Keep open tabs fresh.** Add a gentle refetch of `["theme","published"]` every 60 seconds, only while the tab is visible. Supabase Realtime is not used: `theme_settings` is staff-only under RLS, so visitors would get no events unless that table were opened up, and opening it would break rule 8.
4. **Header/navigation panel.** Remove the legacy nav editor and embed the real `NavigationBuilder` editing UI, which writes `theme.navigation` through the same draft. If embedding gets messy, show a short summary plus a link to Craft Studio → Navigation instead.
5. **Footer panel.** Same approach: embed or link the real Footer Builder, which writes `theme.footerV2`. Keep `theme.nav` and `theme.footer` in the schema only as legacy fallbacks, with no active editor.
6. **Audit every control.** Trace each Brand, Announcement, Hero (all text, colours, CTAs, image), Homepage (marquee, section enable/order/titles/eyebrows) and Design control to its Theme JSON path and to the live component that reads it. Any control that saves to a field nothing reads gets wired to the correct field or removed. The mapping goes into `docs/craft-studio-field-map.md`.
7. **Verified Publish flow** in ThemeBuilder and `useThemeDraft`: save the draft, publish (returns `published_at`), invalidate and refetch `getPublishedTheme`, then compare `published_at`.
   - If they match: show "Published live", and the toolbar shows "Live theme synced".
   - If they don't: show "Theme was saved but live storefront sync could not be verified."
   - Either way, invalidate the Craft Studio dashboard status.
8. **Last-published label** in the Theme Builder toolbar ("Last published: 26 Oct 2026, 10:32 AM"), taken from the real `published_at` and updated right after Publish.

## Verification
- Database: read the row, publish through the server function, and confirm `published` and `published_at` change.
- Call `getPublishedTheme` directly and confirm it returns the new `published_at` and the new value.
- Load `/` with Playwright in a fresh signed-out browser (works like Incognito) and confirm the published hero, announcement, nav label and footer name appear.
- Limitation: this project uses its own Supabase, so I can't sign in as the owner to click Save and Publish myself. You'll need to do one final click-through in Craft Studio, then check craftandcling.shop after publishing the app.
- Report back on all 14 items in the brief's deliverable list.

## Out of scope
No database migration, no RLS changes, no new Supabase client. Projects, products, cart, portal, gang sheet, quotes and assets stay as they are.

## Files
- `src/lib/theme.functions.ts`
- `src/lib/theme-context.tsx`
- `src/components/admin/craft-studio/theme/ThemeBuilder.tsx`
- `src/components/admin/craft-studio/theme/ContentEditors.tsx`
- `src/components/admin/craft-studio/site-editor/useThemeDraft.ts`
- possibly Navigation/Footer builder components (only to expose their panels for embedding)
- new `docs/craft-studio-field-map.md`
