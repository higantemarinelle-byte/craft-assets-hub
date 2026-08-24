import type { StorefrontStatus } from "@/lib/craft-studio";
import { formatAbsolute, formatRelative } from "@/lib/craft-studio";
import { Globe, FileEdit, Rocket, Clock, Palette } from "lucide-react";

export function StatusPanel({ status, loading }: { status: StorefrontStatus; loading?: boolean }) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: string; title?: string }> = [
    {
      icon: <Globe className="h-4 w-4" />,
      label: "Storefront",
      value: status.storefront === "live" ? "Live" : "Offline",
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      label: "Draft",
      value: status.hasUnpublishedChanges ? "Draft pending" : "No unpublished changes",
    },
    {
      icon: <Rocket className="h-4 w-4" />,
      label: "Last published",
      value: status.lastPublished ? formatRelative(status.lastPublished) : "Never published",
      title: formatAbsolute(status.lastPublished),
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Last updated",
      value: status.lastUpdated ? formatRelative(status.lastUpdated) : "Never updated",
      title: formatAbsolute(status.lastUpdated),
    },
    { icon: <Palette className="h-4 w-4" />, label: "Current theme", value: status.currentTheme },
  ];

  return (
    <div className="rounded-lg border-2 border-ink bg-cream p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
        Storefront status
        {loading && <span className="text-[10px] font-normal normal-case text-muted-foreground">refreshing…</span>}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="rounded border-2 border-ink/10 bg-white/50 p-3">
            <dt className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {r.icon} {r.label}
            </dt>
            <dd className="text-sm font-semibold" title={r.title}>
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
