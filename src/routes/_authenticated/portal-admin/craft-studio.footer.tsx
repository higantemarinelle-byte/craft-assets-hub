import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import { FooterBuilder } from "@/components/admin/craft-studio/footer/FooterBuilder";

export const Route = createFileRoute("/_authenticated/portal-admin/craft-studio/footer")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Footer Builder — Craft Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) throw redirect({ to: "/portal-admin" });
  },
  component: FooterBuilder,
});