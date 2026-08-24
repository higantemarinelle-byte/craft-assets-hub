import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import type { CraftModule } from "@/lib/craft-studio";
import { formatAbsolute, formatRelative } from "@/lib/craft-studio";

function splitHref(href: string): { to: string; search: Record<string, string> } {
  const [to, qs] = href.split("?");
  const search: Record<string, string> = {};
  if (qs) {
    for (const [k, v] of new URLSearchParams(qs).entries()) search[k] = v;
  }
  return { to, search };
}

export function ModuleCard({
  module,
  icon,
  lastUpdated,
}: {
  module: CraftModule;
  icon?: ReactNode;
  /** Real ISO timestamp for this module's underlying data, or null. */
  lastUpdated?: string | null;
}) {
  const isAvailable = module.status === "available" && !!module.href;
  const link = module.href ? splitHref(module.href) : null;

  return (
    <div className="flex h-full flex-col rounded-lg border-2 border-ink bg-cream p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-bold">{module.title}</h3>
        </div>
        <StatusPill status={module.status} />
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{module.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1" title={lastUpdated ? formatAbsolute(lastUpdated) : undefined}>
          <Clock className="h-3 w-3" />
          {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : "Never updated"}
        </span>
        {isAvailable && link ? (
          <Link
            to={link.to}
            search={link.search}
            className="inline-flex items-center gap-1 rounded border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold hover:bg-yellow/80"
          >
            {module.quickActionLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 rounded border-2 border-ink/30 bg-ink/5 px-3 py-1 text-xs font-bold text-ink/50"
            title="Coming soon"
          >
            {module.quickActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: CraftModule["status"] }) {
  if (status === "available") {
    return (
      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
        Available
      </span>
    );
  }
  return (
    <span className="rounded bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/60">
      Coming Soon
    </span>
  );
}
