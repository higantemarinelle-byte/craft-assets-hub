import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import { ThemeBuilder } from "@/components/admin/craft-studio/theme/ThemeBuilder";

const VALID_PANELS = ["homepage", "theme", "announcement", "draft", "history"] as const;

export const Route = createFileRoute("/_authenticated/portal-admin/theme")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const raw = typeof search.panel === "string" ? search.panel : undefined;
    const panel = VALID_PANELS.includes(raw as any) ? (raw as (typeof VALID_PANELS)[number]) : undefined;
    return panel ? { panel } : {};
  },
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
