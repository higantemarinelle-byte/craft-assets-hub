# Craft Studio field map (editor → Theme JSON → live reader)

| Editor | Theme JSON path | Live component |
|---|---|---|
| Brand name / logo | brand.name, brand.logoAssetId, brand.logoUrl | Header.tsx, Footer.tsx |
| Announcement enabled/text/link | announcement.* | AnnouncementBar.tsx |
| Hero eyebrow, headlines, highlights, colours, body, CTAs, image | home.hero.* | routes/index.tsx |
| Marquee enabled/items | home.marquee.* | routes/index.tsx (Marquee) |
| Section enable/order/titles/eyebrows | home.sections[] | routes/index.tsx |
| Colours, typography, buttons, radius, spacing | tokens.* | ThemeProvider + StorefrontThemeScope |
| Pages (about, product trust badges) | pages.* | routes/about.tsx, routes/index.tsx |
| Currency | commerce.currency | lib/format.ts |
| Navigation (Navigation Builder) | navigation.* | Header.tsx |
| Footer (Footer Builder) | footerV2.* | Footer.tsx |

Legacy only (no active editor): `nav`, `footer`, `inventory`.

## Shown in Theme Builder preview
| Field | Preview |
|---|---|
| home.hero.imageAssetId / imageUrl | Yes — right column, same image component as live |
| brand.logoAssetId / logoUrl | Yes — preview header |
| pages.product.trustBadges | Yes — under hero buttons |
| Categories / Best sellers cards | Sample cards (real catalog data only on live site) |
