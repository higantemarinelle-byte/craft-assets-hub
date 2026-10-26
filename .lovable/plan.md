# Fix: Footer (and Navigation) editing in Craft Studio

## What went wrong (confirmed)
- In my last change, I took the footer fields out of the Theme Builder's "Footer content" panel and put an "Open Footer Builder" link in their place.
- That link is broken. The Craft Studio home page is the "parent" page of the Footer Builder, Navigation Builder and Media Library pages, but it never shows its child pages. So any of those links just lands back on the Craft Studio home cards, and the footer cannot be edited at all.
- I should have caught this before telling you it was fixed. I'm sorry.

## Fix
1. **Make the builder pages open.** Turn the Craft Studio home page into a normal standalone page instead of a parent. This is the same fix we used for the Products list earlier. After it, `/portal-admin/craft-studio/footer`, `/navigation` and `/assets` each open their own editor.
2. **Edit the footer inside the Theme Builder again.** The "Footer content" panel gets real editable fields again: footer on/off, business name, description, columns and links, social links and copyright. They save to the same footer data the live site displays, so you can change it alongside everything else and see it in the live preview. A small "Open full Footer Builder" link stays for advanced layout.
3. **Same for Header / navigation.** That panel gets editable menu labels and links (and Project Cart label) wired to the live header, plus a link to the full Navigation Builder.

## Verification (before I report back)
- Check the build and type check pass.
- Open each builder page in a browser and confirm it shows the editor, not the Craft Studio home cards. Each page checks that you're signed in as the owner before it opens. I can't sign in as you, so I'll confirm this by reading the page's code. The routing itself I'll confirm by checking that the pages are no longer nested under the Craft Studio home page.
- You do one final check: change the footer business name, Publish, then look at the live footer.

## Technical details
- Rename `src/routes/_authenticated/portal-admin/craft-studio.tsx` to `craft-studio.index.tsx`. Update the route id to `/_authenticated/portal-admin/craft-studio/`, keeping its head, beforeLoad and component.
- Add `ThemeFooterEditor` and `ThemeNavigationEditor` to `ContentEditors.tsx`. They use the Theme Builder's shared `update` and edit `footerV2` and `navigation`, reusing `FOOTER_LIMITS` and the safe-URL checks from `site-config`.
- Use them in the `navigation` and `footer` panels of `ThemeBuilder.tsx`, next to the builder links.
- No database or backend changes.
