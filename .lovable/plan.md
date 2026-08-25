# Repair Craft Studio Live Section Preview

## Confirmed cause

`ThemeBuilder` tracks the selected homepage section, but passes only the draft theme to `ThemePreviewCanvas`. The preview renders the announcement, a legacy header, hero, generic sample cards, and a legacy footer; it never renders `theme.home.sections`. As a result, selecting or editing Categories, Popular Designs, How It Works, Testimonials, or Banner has no corresponding preview target or visible output.

## Changes

1. **Render the editable homepage in the preview**
   - Replace the generic sample area with preview representations for every supported homepage section type: Categories, Featured Products, How It Works, Testimonials, and Banner.
   - Render sections from `theme.home.sections` in their saved order and respect each section's `enabled` state.
   - Display the real editable fields—including section title, eyebrow, banner copy/CTA, and testimonial content—so draft edits appear immediately.

2. **Connect editor selection to preview focus**
   - Pass the active panel and selected section ID from `ThemeBuilder` into `ThemePreviewCanvas`.
   - Give preview regions stable targets for Announcement, Header, Hero, Marquee, each homepage section, and Footer.
   - When a user chooses an editor panel or homepage section, scroll that preview region into view and add a restrained active outline so it is clear what is being edited.
   - Remove the focus treatment when navigating to panels that do not represent a storefront region.

3. **Use the current theme shapes**
   - Make the preview header use `theme.navigation` rather than the legacy `theme.nav` list.
   - Make the preview footer use `theme.footerV2` rather than the legacy footer fields.
   - Keep the preview driven entirely by the unsaved local `draft`; no save or publish is required to see changes.

4. **Preserve editor behavior**
   - Do not change theme persistence, publishing, version history, permissions, dashboard status, or the public storefront.
   - Preserve desktop/tablet/mobile preview controls and the existing two-column Craft OS layout.

## Verification

- Select each homepage section and confirm the preview automatically focuses and highlights the matching region.
- Change section titles, eyebrows, visibility, order, banner copy/CTA, and available testimonial content; confirm every change appears immediately before saving.
- Edit Announcement, Header, Hero, Marquee, and Footer and confirm the corresponding preview region updates and focuses.
- Confirm hidden sections disappear, reordered sections move, device controls still work, and no runtime/build errors are introduced.
