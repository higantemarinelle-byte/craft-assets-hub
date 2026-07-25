import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — Craft & Cling" },
      { name: "description", content: "Completing Google sign-in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Let supabase-js consume the #access_token=... fragment.
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      const opener = window.opener as Window | null;
      const targetOrigin = window.location.origin;

      if (opener) {
        opener.postMessage(
          { type: "cc-google-auth", ok: !error && !!data.session, error: error?.message },
          targetOrigin,
        );
        window.close();
        return;
      }

      // No opener (user opened the callback URL directly) — go home.
      window.location.replace(data.session ? "/account" : "/auth");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}