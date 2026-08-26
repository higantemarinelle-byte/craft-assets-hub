import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import type { CraftGroup } from "@/lib/craft-studio";
import { formatAbsolute, formatRelative } from "@/lib/craft-studio";

function splitHref(href: string): { to: string; search: Record<string, string> } {
  const [to, qs] = href.split("?");
  const search: Record<string, string> = {};
  if (qs) {
    for (const [k, v] of new URLSearchParams(qs).entries()) search[k] = v;
  }
  return { to, search };
}

/** One grouped Craft Studio area: primary action + direct sub-links. */
export function ModuleCard({
  group,
  icon,
  lastUpdated,
}: {
  group: CraftGroup;
  icon?: ReactNode;
  /** Real ISO timestamp for this group's underlying data, or null. */
  lastUpdated?: string | null;
}) {
  const primary = splitHref(group.primary.href);

  return (
    <div className="flex h-full flex-col rounded-lg border-2 border-ink bg-cream p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-bold">{group.title}</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{group.description}</p>

      {group.links.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {group.links.map((l) => {
            const link = splitHref(l.href);
            return (
              <li key={l.href}>
                <Link
                  to={link.to}
                  search={link.search}
                  className="inline-flex rounded border-2 border-ink/20 bg-white/60 px-2 py-1 text-xs font-semibold hover:border-ink"
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1" title={lastUpdated ? formatAbsolute(lastUpdated) : undefined}>
          <Clock className="h-3 w-3" />
          {lastUpdated ? `Updated ${formatRelative(lastUpdated)}` : "Never updated"}
        </span>
        <Link
          to={primary.to}
          search={primary.search}
          className="inline-flex items-center gap-1 rounded border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold hover:bg-yellow/80"
        >
          {group.primary.label} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
