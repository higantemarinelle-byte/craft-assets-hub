import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Package,
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
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isOwnerUser } from "@/lib/permissions";

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
  const { isOwner: hasOwnerRole, user } = useAuth();
  const isCraftOwner = isOwnerUser(user);

  const nav: NavItem[] = [
    { to: "/portal-admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/portal-admin/projects", label: "Projects", icon: FolderKanban },
    { to: "/portal-admin/products", label: "Products", icon: Package },
    { to: "/portal-admin/customers", label: "Customers", icon: UserCircle },
    { label: "Inventory", icon: Boxes, disabled: true },
    ...(isCraftOwner
      ? [{ to: "/portal-admin/craft-studio", label: "Craft Studio", icon: Palette, ownerOnly: true }]
      : []),
    { label: "Marketing", icon: Megaphone, disabled: true },
    { label: "Reports", icon: BarChart3, disabled: true },
    { to: "/portal-admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/portal-admin/discounts", label: "Discounts", icon: Tag },
    ...(hasOwnerRole ? [{ to: "/portal-admin/employees", label: "Employees", icon: Users }] : []),
    { label: "Settings", icon: Settings, disabled: true },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px,1fr] md:px-6">
        <aside className="h-fit rounded-lg border-2 border-ink bg-ink p-3 text-cream">
          <div className="mb-3 px-2 py-1 text-xs font-bold uppercase tracking-widest text-yellow">Portal</div>
          <nav className="space-y-1 text-sm">
            {nav.map((item) => {
              const Icon = item.icon;
              if (item.disabled || !item.to) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 rounded px-3 py-2 font-semibold text-cream/50"
                    title="Coming soon"
                    aria-disabled="true"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {item.label}
                    </span>
                    <span className="rounded bg-cream/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-cream/70">
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
                  activeProps={{ className: "bg-magenta" }}
                  className="flex items-center gap-2 rounded px-3 py-2 font-semibold hover:bg-cream/10"
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
