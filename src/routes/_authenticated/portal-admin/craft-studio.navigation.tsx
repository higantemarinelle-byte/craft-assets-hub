import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import { NavigationBuilder } from "@/components/admin/craft-studio/navigation/NavigationBuilder";

export const Route = createFileRoute("/_authenticated/portal-admin/craft-studio/navigation")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Navigation Builder — Craft Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) throw redirect({ to: "/portal-admin" });
  },
  component: NavigationBuilder,
});