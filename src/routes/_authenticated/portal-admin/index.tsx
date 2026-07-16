import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminStats, adminSalesSeries, adminLowStock, adminTopProducts } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Package, ShoppingBag, DollarSign, EyeOff, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/portal-admin/")({
  head: () => ({ meta: [{ title: "Admin — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(adminStats);
  const fetchSeries = useServerFn(adminSalesSeries);
  const fetchLow = useServerFn(adminLowStock);
  const fetchTop = useServerFn(adminTopProducts);

  const { data } = useQuery({ queryKey: ["admin:stats"], queryFn: () => fetchStats() });
  const { data: low = [] } = useQuery({ queryKey: ["admin:low"], queryFn: () => fetchLow({ data: {} }) });
  const { data: top = [] } = useQuery({ queryKey: ["admin:top"], queryFn: () => fetchTop() });
  const { data: series = [] } = useQuery({
    queryKey: ["admin:series", 30],
    queryFn: () => fetchSeries({ data: { days: 30 } }),
    enabled: data?.isOwner === true,
    retry: false,
  });

  return (
    <div>
      <h1 className="text-display text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">A quick look at the shop.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card icon={ShoppingBag} label="Orders" value={data?.orderCount ?? "…"} accent="bg-cyan" />
        <Card icon={Package} label="Products" value={data?.productCount ?? "…"} accent="bg-yellow" />
        <Card
          icon={data?.isOwner === false ? EyeOff : DollarSign}
          label="Revenue (recent 50)"
          value={data?.isOwner === false ? "Owner only" : data?.revenue != null ? money(data.revenue) : "…"}
          accent="bg-magenta text-cream"
        />
      </div>

      {data?.isOwner && (
        <div className="mt-6 rounded-lg border-2 border-ink bg-cream p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-widest">Revenue — last 30 days</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: any) => money(Number(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#ec3b83" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border-2 border-ink bg-cream p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <AlertTriangle className="h-4 w-4 text-magenta" /> Low stock
          </div>
          {low.length === 0 ? (
            <p className="text-xs text-muted-foreground">Everything is well-stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {low.map((v: any) => (
                <li key={v.id} className="flex items-center justify-between border-b border-ink/10 pb-1">
                  <Link to="/portal-admin/products/$id" params={{ id: v.product_id }} className="hover:underline">
                    {v.product_name} <span className="text-muted-foreground">— {v.label}</span>
                  </Link>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${v.stock === 0 ? "bg-magenta text-cream" : "bg-yellow"}`}>{v.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border-2 border-ink bg-cream p-5">
          <div className="mb-3 text-sm font-bold uppercase tracking-widest">Top products (units)</div>
          {top.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sales yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {top.map((p: any) => (
                <li key={p.name} className="flex items-center justify-between border-b border-ink/10 pb-1">
                  <span>{p.name}</span>
                  <span className="font-bold">{p.units}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, accent }: any) {
  return (
    <div className={`rounded-lg border-2 border-ink p-5 ${accent}`}>
      <Icon className="h-6 w-6" />
      <div className="mt-4 text-xs font-bold uppercase tracking-widest">{label}</div>
      <div className="mt-1 text-display text-3xl">{value}</div>
    </div>
  );
}
