# Craft Studio: Real Live Preview + Simplified Dashboard

## Part 1 — Fix the live preview

### Confirmed cause

The Theme Builder tracks which homepage section is selected, but the preview only receives the draft theme. The preview renders a fixed mock — announcement, a legacy header, hero, three generic sample cards, and a legacy footer — and never renders `theme.home.sections`. So selecting Categories, Popular Designs, How It Works, Testimonials, or Banner has nothing to show and nothing to highlight.

### Changes

1. **Render the real homepage in the preview**
   - Replace the generic sample cards with preview representations of every homepage section type: Categories, Popular Designs, How It Works, Testimonials, Banner.
   - Render sections in their saved order and respect each section's visibility toggle.
   - Show the actual editable fields (title, eyebrow, banner copy and CTA, testimonial content) so edits appear instantly.

2. **Connect selection to the preview**
   - Pass the active panel and selected section into the preview.
   - Give each preview region a stable target: Announcement, Header, Hero, Marquee, each homepage section, Footer.
   - Selecting a panel or section scrolls that region into view and applies a restrained active outline; the outline clears for panels with no storefront region (Presets, Version history, etc.).

3. **Use current data shapes**
   - Preview header reads the Navigation Builder data instead of the legacy link list.
   - Preview footer reads the Footer Builder data instead of the legacy footer fields.
   - Preview stays driven by unsaved local draft state — no save required.

4. **Preserved**
   - No changes to saving, publishing, version history, permissions, or the public storefront. Device size controls and the two-column layout stay.

## Part 2 — Collapse the Craft Studio dashboard into three cards

Most current cards are just deep links into Theme Builder panels, which duplicates the editor's own sidebar. The module grid becomes three cards, below the existing status panel:

```text
Storefront Editor   Media Library        Publishing
Theme, homepage,    Banners, gallery,    Review draft,
sections, hero,     logos and other      publish live,
announcement,       media assets.        version history.
navigation, footer.
```

- **Storefront Editor** — primary action opens the Theme Builder. Card lists its areas as small direct links (Homepage, Theme, Announcement, Navigation, Footer) so nothing becomes harder to reach.
- **Media Library** — opens the existing assets page.
- **Publishing** — opens draft review / version history.
- Timestamps stay real: Storefront Editor and Publishing use theme draft/publish times, Media Library uses the newest asset time.
- Gallery, SEO and Campaigns are no longer cards; they are listed as a short "Coming soon" line so the page stops advertising eleven modules where three exist.
- Every existing route keeps working; this is a presentation change only.

## Verification

- Select each homepage section and confirm the preview focuses and highlights the matching region.
- Edit titles, eyebrows, visibility, order, banner copy/CTA, announcement, hero, marquee, header and footer; confirm each change shows immediately before saving.
- Confirm the three dashboard cards show real timestamps and that every link (Theme Builder panels, Media Library, Publishing) opens the correct place.
- Confirm no build or runtime errors.
