import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetCustomer } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/customers/$id")({
  head: () => ({ meta: [{ title: "Customer — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const getFn = useServerFn(adminGetCustomer);
  const { data } = useQuery({ queryKey: ["admin:customer", id], queryFn: () => getFn({ data: { id } }) });
  if (!data?.profile) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const p: any = data.profile;
  const orders: any[] = data.orders ?? [];
  const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div>
      <Link to="/portal-admin/customers" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="h-4 w-4" /> All customers</Link>
      <h1 className="text-display text-3xl">{p.full_name ?? p.email}</h1>
      <p className="text-sm text-muted-foreground">{p.email}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card label="Orders" value={orders.length} />
        <Card label="Lifetime spend" value={money(spent)} />
        <Card label="Joined" value={new Date(p.created_at).toLocaleDateString()} />
      </div>

      <h2 className="mt-10 text-display text-2xl">Order history</h2>
      <div className="mt-3 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-right">Items</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-ink/10">
                <td className="p-3 font-bold">
                  <Link to="/portal-admin/orders/$id/packing-slip" params={{ id: o.id }} className="hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="p-3 text-right">{(o.order_items ?? []).reduce((s: number, i: any) => s + i.quantity, 0)}</td>
                <td className="p-3 text-right font-bold">{money(Number(o.total))}</td>
                <td className="p-3 text-xs uppercase">{o.status}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-cream p-5">
      <div className="text-xs font-bold uppercase tracking-widest">{label}</div>
      <div className="mt-1 text-display text-2xl">{value}</div>
    </div>
  );
}
