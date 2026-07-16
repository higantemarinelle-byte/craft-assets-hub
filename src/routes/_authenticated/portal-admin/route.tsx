import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Tag,
  Users,
  Palette,
  UserCircle,
  FolderKanban,
  Boxes,
  Megaphone,
  BarChart3,
  Settings,
  Menu,
  ExternalLink,
  LogOut,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isOwnerUser } from "@/lib/permissions";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal-admin")({
  ssr: false,
  beforeLoad: async () => {
    // Verify staff role from DB (client-side gate — server functions re-verify)
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.user.id);
    const list = (roles ?? []).map((r: any) => r.role);
    if (!list.includes("owner") && !list.includes("employee")) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

type NavItem = {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  exact?: boolean;
  ownerOnly?: boolean;
};

function AdminLayout() {
  const { isOwner: hasOwnerRole, user, signOut } = useAuth();
  const isCraftOwner = isOwnerUser(user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav: NavItem[] = [
    { to: "/portal-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/portal-admin/projects", label: "Projects", icon: FolderKanban },
    { to: "/portal-admin/products", label: "Products", icon: Package },
    { to: "/portal-admin/categories", label: "Categories", icon: Tags },
    { to: "/portal-admin/customers", label: "Customers", icon: UserCircle },
    { label: "Inventory", icon: Boxes, disabled: true },
    { to: "/portal-admin/gang-sheet/pricing", label: "Gang Sheet Pricing", icon: Layers },
    ...(isCraftOwner
      ? [{ to: "/portal-admin/craft-studio", label: "Craft Studio", icon: Palette, ownerOnly: true }]
      : []),
    { label: "Marketing", icon: Megaphone, disabled: true },
    { label: "Reports", icon: BarChart3, disabled: true },
    { to: "/portal-admin/orders", label: "Legacy Orders", icon: ShoppingBag },
    { to: "/portal-admin/discounts", label: "Discounts", icon: Tag },
    ...(hasOwnerRole ? [{ to: "/portal-admin/employees", label: "Employees", icon: Users }] : []),
    { label: "Settings", icon: Settings, disabled: true },
  ];

  const currentPage =
    nav.find((n) => n.to && (n.exact ? pathname === n.to : pathname.startsWith(n.to!)))?.label ??
    "Craft OS";

  const sidebarContent = <SidebarNav nav={nav} onNavigate={() => setMobileOpen(false)} />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:z-30 bg-slate-900 text-slate-100 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen w-full flex-col md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-slate-900 p-0 text-slate-100 border-slate-800">
              <SheetHeader className="sr-only"><SheetTitle>Craft OS navigation</SheetTitle></SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{currentPage}</div>
            <div className="truncate text-xs text-slate-500">Craft OS</div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Storefront
          </a>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-x-hidden bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ nav, onNavigate }: { nav: NavItem[]; onNavigate: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-magenta text-cream font-black">C</div>
        <div>
          <div className="text-sm font-bold tracking-wide text-white">Craft OS</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">Portal</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4 text-sm">
        {nav.map((item) => {
          const Icon = item.icon;
          if (item.disabled || !item.to) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-2 rounded-md px-3 py-2 font-medium text-slate-500"
                title="Coming soon"
                aria-disabled="true"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" /> {item.label}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <Link
              key={item.to}
              to={item.to as any}
              activeOptions={{ exact: !!item.exact }}
              activeProps={{ className: "bg-magenta text-white hover:bg-magenta" }}
              inactiveProps={{ className: "text-slate-300 hover:bg-slate-800 hover:text-white" }}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors"
            >
              <Icon className="h-4 w-4" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500">
        Crafted with care
      </div>
    </div>
  );
}
