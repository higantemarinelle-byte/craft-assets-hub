# Show/hide switches for hero buttons

## What you get
In Theme Builder → Hero, each button ("Shop transfers" and "Build a gang sheet") gets its own **Show button** switch next to its label. Turn one off and it disappears from the preview straight away. After you Publish, it disappears from the live store too. Your label and link are kept, so turning it back on restores the button as it was.

The banner section's button gets the same switch.

## Behaviour
- Both buttons stay visible by default, so your current homepage doesn't change.
- If both buttons are off, the empty button row is removed so there's no leftover gap.

## Technical details
- `src/lib/theme.ts`: add optional `ctaPrimaryEnabled` and `ctaSecondaryEnabled` to the hero, and `ctaEnabled` to the banner section. A missing value counts as on.
- `ContentEditors.tsx`: add a Switch beside each CTA label field.
- `src/routes/index.tsx` and `ThemePreviewCanvas.tsx`: render each button only when it's enabled (`!== false`).
- Add a small test for the visibility rule (missing or true shows the button, false hides it).
