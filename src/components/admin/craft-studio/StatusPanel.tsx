import type { StorefrontStatus } from "@/lib/craft-studio";
import { Globe, FileEdit, Rocket, Clock, Palette } from "lucide-react";

function fmt(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

export function StatusPanel({ status }: { status: StorefrontStatus }) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    {
      icon: <Globe className="h-4 w-4" />,
      label: "Storefront",
      value: status.storefront === "live" ? "Live" : "Offline",
    },
    {
      icon: <FileEdit className="h-4 w-4" />,
      label: "Draft",
      value: status.draftStatus === "no_draft" ? "No draft" : "Draft pending",
    },
    { icon: <Rocket className="h-4 w-4" />, label: "Last published", value: fmt(status.lastPublished) },
    { icon: <Clock className="h-4 w-4" />, label: "Last updated", value: fmt(status.lastUpdated) },
    { icon: <Palette className="h-4 w-4" />, label: "Current theme", value: status.currentTheme },
  ];

  return (
    <div className="rounded-lg border-2 border-ink bg-cream p-4">
      <div className="mb-3 text-sm font-bold uppercase tracking-widest">Storefront status</div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {rows.map((r) => (
          <div key={r.label} className="rounded border-2 border-ink/10 bg-white/50 p-3">
            <dt className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {r.icon} {r.label}
            </dt>
            <dd className="text-sm font-semibold">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
