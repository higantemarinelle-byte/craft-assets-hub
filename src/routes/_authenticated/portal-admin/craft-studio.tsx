import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import { CRAFT_MODULES, DEFAULT_STOREFRONT_STATUS } from "@/lib/craft-studio";
import { ModuleCard } from "@/components/admin/craft-studio/ModuleCard";
import { StatusPanel } from "@/components/admin/craft-studio/StatusPanel";
import { AIActions } from "@/components/admin/craft-studio/AIActions";
import {
  Palette,
  LayoutTemplate,
  Menu,
  PanelBottom,
  Megaphone,
  Images,
  Search,
  FolderOpen,
  CalendarDays,
  FileEdit,
  Rocket,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/craft-studio")({
  ssr: false,
  head: () => ({ meta: [{ title: "Craft Studio — Admin" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) {
      throw redirect({ to: "/portal-admin" });
    }
  },
  component: CraftStudioLanding,
});

const ICONS: Record<string, React.ReactNode> = {
  homepage: <LayoutTemplate className="h-5 w-5" />,
  theme: <Palette className="h-5 w-5" />,
  navigation: <Menu className="h-5 w-5" />,
  footer: <PanelBottom className="h-5 w-5" />,
  announcement: <Megaphone className="h-5 w-5" />,
  gallery: <Images className="h-5 w-5" />,
  seo: <Search className="h-5 w-5" />,
  media_library: <FolderOpen className="h-5 w-5" />,
  campaigns: <CalendarDays className="h-5 w-5" />,
  drafts: <FileEdit className="h-5 w-5" />,
  publish: <Rocket className="h-5 w-5" />,
};

function CraftStudioLanding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl">Craft Studio</h1>
        <p className="text-sm text-muted-foreground">
          Manage your storefront, branding, content, and publishing from one place.
        </p>
      </div>

      <StatusPanel status={DEFAULT_STOREFRONT_STATUS} />

      <div>
        <div className="mb-3 text-sm font-bold uppercase tracking-widest">Modules</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRAFT_MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} icon={ICONS[m.id]} />
          ))}
        </div>
      </div>

      <AIActions />
    </div>
  );
}
