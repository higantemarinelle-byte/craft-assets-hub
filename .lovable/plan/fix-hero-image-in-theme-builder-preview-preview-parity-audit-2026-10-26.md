# Fix hero image in Theme Builder preview + preview parity audit

## Problem
The live storefront shows the hero image (right-hand panel), but the Theme Builder live preview never draws it. The preview's hero block only renders text and buttons, so choosing an image looks like it does nothing.

## Fix
1. **Hero image in preview** — In the preview, render the hero as two columns like the live homepage: text on the left, image on the right using the same `StorefrontAssetImage` (asset ID first, URL fallback). With no image, show the same magenta/cyan "Ink hits film." placeholder as the live site. Collapses to one column on the Mobile preview.
2. **Parity audit of every editor field** — Go through `docs/craft-studio-field-map.md` and compare each field with what the preview draws. Wire up any field the preview ignores, including:
   - Brand logo (`brand.logoAssetId` / `logoUrl`) in the preview header
   - Images on homepage sections (categories, gallery, banners) where the live site shows them
   - Trust badges under the hero
3. **Keep one source** — Preview reads the same draft theme values as the live page, so a saved change shows the same in both places.
4. **Field map** — Update the doc with a "shown in preview" column so gaps are visible.

## Verification
- Pick a hero image, confirm it appears in the preview at once, then Publish and confirm it on the storefront.
- Remove the image and confirm the placeholder returns in both places.
- Spot-check logo and section images the same way.

## Technical details
- Files: `src/components/admin/craft-studio/theme/ThemePreviewCanvas.tsx`, `docs/craft-studio-field-map.md`.
- Reuse `StorefrontAssetImage` from the homepage; no database or permission changes.
