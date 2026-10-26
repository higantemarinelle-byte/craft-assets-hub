import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import {
  CRAFT_GROUPS,
  CRAFT_COMING_SOON,
  type CraftGroupId,
  type StorefrontStatus,
} from "@/lib/craft-studio";
import { adminGetCraftStudioStatus } from "@/lib/craft-studio.functions";
import { craftStudioQueryKeys } from "@/lib/theme-query-keys";
import { ModuleCard } from "@/components/admin/craft-studio/ModuleCard";
import { StatusPanel } from "@/components/admin/craft-studio/StatusPanel";
import { Palette, FolderOpen, Rocket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/craft-studio/")({
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

const ICONS: Record<CraftGroupId, React.ReactNode> = {
  storefront_editor: <Palette className="h-5 w-5" />,
  media_library: <FolderOpen className="h-5 w-5" />,
  publishing: <Rocket className="h-5 w-5" />,
};

function CraftStudioLanding() {
  const statusFn = useServerFn(adminGetCraftStudioStatus);
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: craftStudioQueryKeys.dashboard,
    queryFn: () => statusFn(),
    retry: false,
  });

  const status: StorefrontStatus = {
    storefront: data?.storefront ?? "offline",
    hasUnpublishedChanges: data?.hasUnpublishedChanges ?? false,
    lastPublished: data?.publishedAt ?? null,
    lastUpdated: data?.draftUpdatedAt ?? data?.updatedAt ?? null,
    currentTheme: data?.themeName ?? "—",
  };

  const groupTimestamp = (id: CraftGroupId): string | null => {
    if (!data) return null;
    switch (id) {
      case "media_library":
        return data.assetsUpdatedAt;
      case "publishing":
        return data.publishedAt ?? data.lastVersionAt;
      case "storefront_editor":
        return data.draftUpdatedAt ?? data.updatedAt;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-3xl">Craft Studio</h1>
        <p className="text-sm text-muted-foreground">
          Manage your storefront, branding, content, and publishing from one place.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Couldn't load storefront status: {(error as any)?.message ?? "Unknown error"}
        </div>
      )}

      <StatusPanel status={status} loading={isLoading || isFetching} />

      <div>
        <div className="mb-3 text-sm font-bold uppercase tracking-widest">Areas</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRAFT_GROUPS.map((g) => (
            <ModuleCard key={g.id} group={g} icon={ICONS[g.id]} lastUpdated={groupTimestamp(g.id)} />
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Coming soon: {CRAFT_COMING_SOON.join(" · ")}.
      </p>
    </div>
  );
}
