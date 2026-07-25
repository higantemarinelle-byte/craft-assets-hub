
## Problem

Clicking the edit (pencil) icon on any pre-made product leaves the editor page stuck on **"Loading product…"** forever. No error toast, no console error, nothing to act on. The list page (`/portal-admin/products`) loads fine, so the failure is specific to the `/portal-admin/products/$id` route or its `adminGetProduct` server function call.

The current query in `src/routes/_authenticated/portal-admin/products.$id.tsx` shows a spinner while `query.isLoading` is `true` and shows an error UI only when `query.isError` fires. If the network request never resolves and never rejects, we sit on the spinner forever with no feedback — exactly what you're seeing.

## Diagnosis first (no code changes yet)

I will not change product logic before I have a real signal. Steps:

1. Open the preview in a headless browser signed in as owner (using the injected Supabase session).
2. Navigate to `/portal-admin/products`, click the pencil on a product, capture:
   - Screenshot of the stuck state.
   - Full console output.
   - Network tab entry for the `adminGetProduct` call (status, response body, timing, whether it's pending/aborted/redirected).
3. From that signal, classify the failure into one of:
   - **A.** Request never fires (routing / hydration bug).
   - **B.** Request fires and hangs (server function never returns).
   - **C.** Request returns 401/403 (auth middleware rejecting) — silently swallowed.
   - **D.** Request returns 200 with unexpected shape and `useQuery` never settles.

## Fix per outcome

- **A** — Fix the route mount. Usually a missing/incorrect param, layout wrapping, or a stale `routeTree.gen.ts`. Restart the route registration.
- **B** — Add an `AbortSignal` timeout on the client query (10s), plus surface the timeout in the error UI. On the server, harden `adminGetProduct` with a `try/catch` around the Supabase call and structured error messages.
- **C** — The most likely culprit given "no error at all". The bearer attacher may not be attaching the token for this specific route, or the session is expired but the client doesn't know. Fix by:
  - Making `useQuery` surface non-2xx responses as thrown errors so the error UI actually renders.
  - Adding a one-shot re-auth check: on 401 from any admin server fn, redirect to `/auth` with a return path.
- **D** — Normalize `adminGetProduct` return type and ensure `useQuery` never stays pending on a resolved-null value.

## Regardless of outcome — small UX/observability fixes I will ship

These are cheap and eliminate the "silent stuck spinner" class of bug for the whole admin:

1. In `products.$id.tsx`: replace the raw `useQuery` with one that has `retry: 0`, a 15s query timeout, and an explicit "Loading is taking longer than expected — reload" fallback after 8s.
2. Wrap the server-fn call in the component so a thrown error is logged to `console.error` before being handed to React Query (so we always have breadcrumbs next time).
3. Add a `console.error` inside `adminGetProduct`'s `catch` path so server-side failures always show in logs.

## Out of scope

- No changes to `ProductForm`, `adminSaveProduct`, categories, images, or variants until the loader path is proven working.
- No schema or RLS changes (this uses the service-role admin client and bypasses RLS anyway).
- No changes to the storefront.

## Acceptance

- I can open an existing product's edit page, see the form populate with its real data, change a field, save, refresh, and see the change persist.
- If any step fails, the UI shows a specific error message (never a silent spinner).
- Screenshot + network log of a working edit round-trip attached in the reply.
