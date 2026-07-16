import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetOrder } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Printer, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/orders/$id/packing-slip")({
  head: () => ({ meta: [{ title: "Packing slip" }, { name: "robots", content: "noindex" }] }),
  component: PackingSlip,
});

function PackingSlip() {
  const { id } = Route.useParams();
  const getFn = useServerFn(adminGetOrder);
  const { data: order } = useQuery({ queryKey: ["admin:order", id], queryFn: () => getFn({ data: { id } }) });
  if (!order) return <div className="text-sm text-muted-foreground">Loading…</div>;
  const items: any[] = order.order_items ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/portal-admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"><ArrowLeft className="h-4 w-4" /> All orders</Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-ink px-4 py-2 text-sm font-bold text-cream hover:bg-magenta"
        >
          <Printer className="h-4 w-4" /> Print
        </button>
      </div>

      <div className="mx-auto max-w-2xl rounded-lg border-2 border-ink bg-white p-8 text-ink print:border-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-display text-2xl">Craft &amp; Cling</div>
            <div className="text-xs text-muted-foreground">Packing slip</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-bold">Order {order.order_number}</div>
            <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ship to</div>
            <div className="mt-1 font-semibold">{order.full_name}</div>
            <div className="whitespace-pre-line text-sm">{formatAddress(order.shipping_address)}</div>
            <div className="text-xs text-muted-foreground">{order.email}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</div>
            <div className="mt-1 uppercase font-bold">{order.status}</div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead className="border-b-2 border-ink">
            <tr>
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-ink/10">
                <td className="py-2">
                  <div className="font-semibold">{i.product_name}</div>
                  <div className="text-xs text-muted-foreground">{i.variant_label}</div>
                </td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{money(Number(i.unit_price))}</td>
                <td className="py-2 text-right">{money(Number(i.unit_price) * i.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            {order.subtotal != null && (
              <div className="flex justify-between"><span>Subtotal</span><span>{money(Number(order.subtotal))}</span></div>
            )}
            {order.discount != null && Number(order.discount) > 0 && (
              <div className="flex justify-between"><span>Discount</span><span>-{money(Number(order.discount))}</span></div>
            )}
            <div className="mt-2 flex justify-between border-t-2 border-ink pt-2 text-base font-bold">
              <span>Total</span><span>{money(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-6 rounded border-2 border-ink/20 bg-yellow/30 p-3 text-sm">
            <div className="text-xs font-bold uppercase tracking-widest">Notes</div>
            <div className="mt-1">{order.notes}</div>
          </div>
        )}

        <div className="mt-10 text-center text-xs text-muted-foreground">Thank you for pressing with us.</div>
      </div>

      <style>{`@media print { body { background: white; } header, footer, aside, .print\\:hidden { display: none !important; } main { padding: 0 !important; } }`}</style>
    </div>
  );
}

function formatAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const { line1, line2, city, state, postal_code, country } = addr;
  return [line1, line2, [city, state, postal_code].filter(Boolean).join(", "), country].filter(Boolean).join("\n");
}
