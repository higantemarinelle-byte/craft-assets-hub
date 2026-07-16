import { ChevronDown, Menu, Search, ShoppingBag, User } from "lucide-react";
import type { StorefrontNavigation } from "@/lib/theme";
import { useState } from "react";

type Props = { navigation: StorefrontNavigation; brandName: string };

export function NavigationPreview({ navigation, brandName }: Props) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const width = device === "desktop" ? "100%" : device === "tablet" ? 720 : 360;
  const links = navigation.links.filter((l) => l.enabled);
  return (
    <div className="rounded-lg border-2 border-ink bg-cream p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</div>
        <div className="inline-flex rounded border border-ink/20 text-xs">
          {(["desktop", "tablet", "mobile"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-2 py-1 capitalize ${device === d ? "bg-ink text-cream" : "hover:bg-ink/5"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto overflow-hidden rounded-md border border-ink/20 bg-white transition-all" style={{ width }}>
        {device === "mobile" ? (
          <MobileHeader nav={navigation} brandName={brandName} links={links} />
        ) : (
          <DesktopHeader nav={navigation} brandName={brandName} links={links} compact={device === "tablet"} />
        )}
      </div>
    </div>
  );
}

function DesktopHeader({
  nav,
  brandName,
  links,
  compact,
}: {
  nav: StorefrontNavigation;
  brandName: string;
  links: StorefrontNavigation["links"];
  compact: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-ink bg-cream px-4 py-3">
      <div className="text-display text-lg font-black">{brandName}</div>
      <nav className="flex flex-1 items-center justify-center gap-4 text-sm font-medium">
        {links.slice(0, compact ? 4 : links.length).map((l) => (
          <div key={l.id} className="relative">
            <span className="inline-flex items-center gap-1 hover:text-magenta">
              {l.label}
              {l.children && l.children.filter((c) => c.enabled).length > 0 && (
                <ChevronDown className="h-3 w-3" />
              )}
            </span>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-1 text-ink/70">
        {nav.showSearch && <Search className="h-4 w-4" />}
        {nav.showAccount && <User className="h-4 w-4" />}
        {nav.showProjectCart && (
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-2.5 py-1 text-xs font-semibold text-cream">
            <ShoppingBag className="h-3.5 w-3.5" /> {nav.projectCartLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function MobileHeader({
  nav,
  brandName,
  links,
}: {
  nav: StorefrontNavigation;
  brandName: string;
  links: StorefrontNavigation["links"];
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b-2 border-ink bg-cream px-3 py-2">
        <Menu className="h-4 w-4" />
        <div className="text-display text-base font-black">{brandName}</div>
        <div className="flex items-center gap-1">
          {nav.showAccount && <User className="h-4 w-4" />}
          {nav.showProjectCart && <ShoppingBag className="h-4 w-4" />}
        </div>
      </div>
      <ul className="divide-y divide-ink/10 bg-white text-sm">
        {links.map((l) => (
          <li key={l.id} className="px-3 py-2">
            {l.label}
            {l.children && l.children.filter((c) => c.enabled).length > 0 && (
              <ul className="mt-1 space-y-1 pl-3 text-xs text-ink/70">
                {l.children.filter((c) => c.enabled).map((c) => <li key={c.id}>{c.label}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}