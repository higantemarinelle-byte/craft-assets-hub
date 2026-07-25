import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: (search.redirect as any) || "/account" });
  },
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    });
    setLoading(false);
    if (error) return toast.error("Sign in failed", { description: error.message });
    navigate({ to: (search.redirect as any) || "/account" });
  };

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      options: {
        data: { full_name: String(fd.get("fullName")) },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) return toast.error("Sign up failed", { description: error.message });
    toast.success("Account created", { description: "You're signed in." });
    navigate({ to: (search.redirect as any) || "/account" });
  };

  const onGoogle = async () => {
    const redirectPath = (search.redirect as string) || "/account";
    const callbackUrl = `${window.location.origin}/auth/callback`;

    // Open the popup synchronously so browsers don't block it after the async call.
    const popup = window.open("about:blank", "cc-google-oauth", "width=520,height=640");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        skipBrowserRedirect: !!popup,
      },
    });

    if (error) {
      popup?.close();
      return toast.error("Google sign-in failed", { description: error.message });
    }

    // Fallback: popup blocked → full-page redirect (Supabase already navigated when skipBrowserRedirect was false).
    if (!popup) return;
    if (!data?.url) {
      popup.close();
      return toast.error("Google sign-in failed", { description: "Missing authorization URL." });
    }

    popup.location.href = data.url;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const payload = event.data as { type?: string; ok?: boolean; error?: string } | null;
      if (!payload || payload.type !== "cc-google-auth") return;
      cleanup();
      try { popup.close(); } catch {}
      if (!payload.ok) {
        return toast.error("Google sign-in failed", { description: payload.error || "Cancelled" });
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        return toast.error("Google sign-in failed", { description: "No session established." });
      }
      toast.success("Signed in");
      navigate({ to: redirectPath as any });
    };
    window.addEventListener("message", onMessage);
    const timer = setInterval(() => {
      if (popup.closed) {
        cleanup();
      }
    }, 500);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border-2 border-ink bg-cream p-6 cmyk-shadow">
        <h1 className="text-display text-3xl">Sign in to Craft &amp; Cling</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track orders, save designs, and check out faster.</p>

        <Button onClick={onGoogle} variant="outline" className="mt-6 w-full border-2 border-ink bg-cream font-semibold hover:bg-yellow">
          Continue with Google
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-ink/20" /> or <div className="h-px flex-1 bg-ink/20" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 border-2 border-ink bg-cream">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={onSignIn} className="space-y-3">
              <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="border-2 border-ink" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required className="border-2 border-ink" /></div>
              <Button type="submit" disabled={loading} className="w-full border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">Sign in</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={onSignUp} className="space-y-3">
              <div><Label htmlFor="su-name">Full name</Label><Input id="su-name" name="fullName" required className="border-2 border-ink" /></div>
              <div><Label htmlFor="su-email">Email</Label><Input id="su-email" name="email" type="email" required className="border-2 border-ink" /></div>
              <div><Label htmlFor="su-pw">Password</Label><Input id="su-pw" name="password" type="password" required minLength={8} className="border-2 border-ink" /></div>
              <Button type="submit" disabled={loading} className="w-full border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">Create account</Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">Back to shop</Link>
        </p>
      </div>
    </div>
  );
}
