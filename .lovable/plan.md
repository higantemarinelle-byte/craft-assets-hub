# Fix Google sign-in in the Lovable editor preview

## Why it fails today

The Lovable editor renders your app inside a sandboxed iframe. `supabase.auth.signInWithOAuth({ provider: "google" })` navigates the current window to `accounts.google.com`, which sends `X-Frame-Options: DENY` and refuses to render inside the iframe — so the button appears to do nothing (or shows a Google error) *only in the editor preview*. Auth logs confirm Supabase is 302-ing to Google correctly; the iframe is the sole blocker.

This project uses your own Supabase (not Lovable-managed auth), so the Lovable broker helper (`lovable.auth.signInWithOAuth`) does not apply. We'll drive the OAuth flow in a popup window instead.

## What to change

**`src/routes/auth.tsx` — `onGoogle` handler**
1. Open a blank popup synchronously inside the click handler (must be sync, or the browser blocks it).
2. Call `supabase.auth.signInWithOAuth` with:
   - `options.skipBrowserRedirect: true` so Supabase returns the authorization URL instead of navigating the current tab.
   - `options.redirectTo: ${window.location.origin}/auth/callback` (a new tiny public route).
3. Point the popup at the returned `data.url`.
4. Listen for a `postMessage` from the callback route with the outcome; on success, close the popup, refresh the session, toast, and navigate to `search.redirect || "/account"`.
5. Fallback: if the popup is blocked (`window.open` returns null), fall back to today's full-page redirect so it still works in a normal browser tab.

**New `src/routes/auth.callback.tsx` (public route)**
- Minimal component that runs on mount:
  - Calls `supabase.auth.getSession()` to let the detectSessionInUrl handler consume the `#access_token=…` fragment.
  - `window.opener?.postMessage({ type: "cc-google-auth", ok: true }, window.location.origin)` then `window.close()`.
  - If there's no `window.opener` (user hit it directly), redirect to `/account`.
- Renders a small "Signing you in…" placeholder.
- Standard `head()` metadata (title, description, `robots: noindex`).

**Supabase / Google configuration (must-do, outside code)**
- **Supabase → Authentication → URL Configuration → Redirect URLs**: add
  - `https://id-preview--f752ae20-1a6e-4e19-9f63-ca06176487e7.lovable.app/auth/callback`
  - `https://f752ae20-1a6e-4e19-9f63-ca06176487e7.lovableproject.com/auth/callback`
  - `https://craft-cling-forge.lovable.app/auth/callback`
  - `https://craftandcling.shop/auth/callback` and `https://www.craftandcling.shop/auth/callback`
- **Google Cloud → OAuth Client → Authorized JavaScript origins**: add each of the above origins (without the `/auth/callback` path).
- **Google Cloud → Authorized redirect URIs**: keep the existing Supabase callback (`https://okppfpaozxowarlrlgnd.supabase.co/auth/v1/callback`) — no change.

## Out of scope

- No changes to email/password sign-in, sign-up, or the existing account/session logic.
- No changes to storefront UI, theme, or admin.
- Not switching to the Lovable auth broker (not applicable for external Supabase).

## Acceptance

- In the Lovable editor preview, clicking **Continue with Google** opens a Google consent popup, and after approval the popup closes and the app lands on `/account` (or the intended redirect) signed in.
- In a normal browser tab (published site or preview opened via ↗), the same button works — via popup, or falling back to full-page redirect if the popup is blocked.
- The `/auth/callback` route is public and doesn't render storefront chrome awkwardly (it just flashes "Signing you in…").
