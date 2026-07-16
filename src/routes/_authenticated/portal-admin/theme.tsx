import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import { ThemeBuilder } from "@/components/admin/craft-studio/theme/ThemeBuilder";

export const Route = createFileRoute("/_authenticated/portal-admin/theme")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Theme Builder — Craft Studio" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) {
      throw redirect({ to: "/portal-admin" });
    }
  },
  component: ThemeBuilder,
});