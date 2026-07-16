import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User, LogOut, LayoutDashboard, ChevronDown, Menu } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { StorefrontAssetImage } from "@/components/site/StorefrontAssetImage";
import { useState } from "react";
import type { NavigationLink } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { count } = useCart();
  const { user, isStaff, signOut } = useAuth();
  const { theme } = useTheme();
  const name = theme.brand.name || "Craft & Cling";
  const [first, ...rest] = name.split(" ");
  const middle = rest.length ? rest[0] : "";
  const last = rest.slice(1).join(" ");
  const nav = theme.navigation;
  const links = (nav?.links ?? []).filter((l) => l.enabled);
  const [mobileOpen, setMobileOpen] = useState(false);
  const stickyCls = nav?.stickyHeader === false ? "" : "sticky top-0 z-40";

  return (
    <header className={`${stickyCls} border-b-2 border-ink bg-cream/95 backdrop-blur`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          {theme.brand.logoAssetId || theme.brand.logoUrl ? (
            <StorefrontAssetImage
              assetId={theme.brand.logoAssetId}
              fallbackUrl={theme.brand.logoUrl}
              alt={name}
              className="h-9 w-auto"
            />
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span className="text-display text-2xl leading-none tracking-tight text-ink">{first}</span>
              {middle && (
                <>
                  <span className="text-display text-2xl leading-none tracking-tight text-magenta">{middle}</span>
                  {last && <span className="text-display text-2xl leading-none tracking-tight text-ink">{last}</span>}
                </>
              )}
            </div>
          )}
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          {links.map((item) => <HeaderLink key={item.id} link={item} />)}
        </nav>

        <div className="flex items-center gap-1">
          {nav?.showSearch !== false && (
            <Link to="/shop" aria-label="Search shop" className="rounded-full p-2 hover:bg-ink/5">
              <Search className="h-5 w-5" />
            </Link>
          )}

          {nav?.showAccount !== false && (user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to="/account"><User className="mr-2 h-4 w-4" /> My Projects</Link>
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <Link to="/portal-admin">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Admin portal
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth" className="rounded-full p-2 hover:bg-ink/5" aria-label="Sign in">
              <User className="h-5 w-5" />
            </Link>
          ))}

          {nav?.showProjectCart !== false && (
            <Link
              to="/cart"
              className="relative ml-1 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-sm font-semibold text-cream transition hover:bg-magenta hover:border-magenta"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{nav?.projectCartLabel || "Project Cart"}</span>
              {count > 0 && (
                <span className="rounded-full bg-yellow px-1.5 text-xs font-bold text-ink">{count}</span>
              )}
            </Link>
          )}

          <button
            className="ml-1 rounded-full p-2 hover:bg-ink/5 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* mobile nav */}
      {mobileOpen && (
        <div className="border-t border-ink/10 bg-cream md:hidden">
          <ul className="divide-y divide-ink/10 px-4 py-2 text-sm">
            {links.map((l) => (
              <li key={l.id} className="py-2">
                <MobileLink link={l} onNavigate={() => setMobileOpen(false)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function HeaderLink({ link }: { link: NavigationLink }) {
  const children = (link.children ?? []).filter((c) => c.enabled);
  const linkProps = link.type === "external"
    ? { href: link.href, target: link.openInNewTab ? "_blank" : undefined, rel: link.openInNewTab ? "noopener noreferrer" : undefined }
    : { href: link.href };
  if (children.length === 0) {
    return <a {...linkProps} className="hover:text-magenta">{link.label}</a>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-1 hover:text-magenta">
          {link.label} <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {children.map((c) => {
          const cp = c.type === "external"
            ? { href: c.href, target: c.openInNewTab ? "_blank" : undefined, rel: c.openInNewTab ? "noopener noreferrer" : undefined }
            : { href: c.href };
          return (
            <DropdownMenuItem key={c.id} asChild>
              <a {...cp}>{c.label}</a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileLink({ link, onNavigate }: { link: NavigationLink; onNavigate: () => void }) {
  const children = (link.children ?? []).filter((c) => c.enabled);
  const linkProps = link.type === "external"
    ? { href: link.href, target: link.openInNewTab ? "_blank" : undefined, rel: link.openInNewTab ? "noopener noreferrer" : undefined }
    : { href: link.href };
  return (
    <div>
      <a {...linkProps} onClick={onNavigate} className="block font-medium">{link.label}</a>
      {children.length > 0 && (
        <ul className="mt-1 space-y-1 pl-3 text-sm text-ink/70">
          {children.map((c) => {
            const cp = c.type === "external"
              ? { href: c.href, target: c.openInNewTab ? "_blank" : undefined, rel: c.openInNewTab ? "noopener noreferrer" : undefined }
              : { href: c.href };
            return <li key={c.id}><a {...cp} onClick={onNavigate}>{c.label}</a></li>;
          })}
        </ul>
      )}
    </div>
  );
}
