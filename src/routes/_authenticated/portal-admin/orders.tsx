import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListOrders, adminUpdateOrderStatus } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Printer } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["pending", "processing", "printed", "shipped", "delivered", "cancelled"] as const;

export const Route = createFileRoute("/_authenticated/portal-admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }, { name: "robots", content: "noindex" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const fetchOrders = useServerFn(adminListOrders);
  const setStatus = useServerFn(adminUpdateOrderStatus);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin:orders"], queryFn: () => fetchOrders() });

  const update = async (id: string, status: any) => {
    await setStatus({ data: { id, status } });
    toast.success("Order updated");
    qc.invalidateQueries({ queryKey: ["admin:orders"] });
  };

  return (
    <div>
      <h1 className="text-display text-3xl">Orders</h1>
      <div className="mt-6 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-right">Items</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Placed</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((o: any) => (
              <tr key={o.id} className="border-t border-ink/10">
                <td className="p-3 font-bold">{o.order_number}</td>
                <td className="p-3">
                  <div>{o.full_name}</div>
                  <div className="text-xs text-muted-foreground">{o.email}</div>
                </td>
                <td className="p-3 text-right">{o.item_count}</td>
                <td className="p-3 text-right font-bold">{money(o.total)}</td>
                <td className="p-3">
                  <select
                    value={o.status}
                    onChange={(e) => update(o.id, e.target.value)}
                    className="rounded border-2 border-ink bg-cream px-2 py-1 text-xs font-semibold uppercase"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <Link to="/portal-admin/orders/$id/packing-slip" params={{ id: o.id }} className="inline-flex items-center gap-1 rounded border-2 border-ink bg-cream px-2 py-1 text-xs font-bold hover:bg-yellow">
                    <Printer className="h-3 w-3" /> Slip
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
