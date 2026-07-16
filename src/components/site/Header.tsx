import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User, LogOut, LayoutDashboard } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { StorefrontAssetImage } from "@/components/site/StorefrontAssetImage";
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

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-cream/95 backdrop-blur">
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
          {theme.nav.items.map((item) => (
            <a key={item.href + item.label} href={item.href} className="hover:text-magenta">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link to="/shop" aria-label="Search shop" className="rounded-full p-2 hover:bg-ink/5">
            <Search className="h-5 w-5" />
          </Link>

          {user ? (
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
          )}

          <Link
            to="/cart"
            className="relative ml-1 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-sm font-semibold text-cream transition hover:bg-magenta hover:border-magenta"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Project Cart</span>
            {count > 0 && (
              <span className="rounded-full bg-yellow px-1.5 text-xs font-bold text-ink">{count}</span>
            )}
          </Link>
        </div>
      </div>

      {/* mobile nav strip */}
      <div className="flex items-center gap-5 overflow-x-auto border-t border-ink/10 px-4 py-2 text-sm md:hidden">
        {theme.nav.items.map((item) => (
          <a key={item.href + item.label} href={item.href}>{item.label}</a>
        ))}
      </div>
    </header>
  );
}
