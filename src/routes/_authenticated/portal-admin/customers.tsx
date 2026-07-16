import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListCustomers } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/portal-admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const fetchCustomers = useServerFn(adminListCustomers);
  const { data = [] } = useQuery({ queryKey: ["admin:customers"], queryFn: () => fetchCustomers() });
  const [q, setQ] = useState("");
  const filtered = data.filter((c: any) =>
    !q || (c.email ?? "").toLowerCase().includes(q.toLowerCase()) || (c.full_name ?? "").toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-3xl">Customers</h1>
        <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-right">Orders</th>
              <th className="p-3 text-right">Spent</th>
              <th className="p-3 text-left">Last order</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-t border-ink/10 hover:bg-yellow/20">
                <td className="p-3 font-semibold">
                  <Link to="/portal-admin/customers/$id" params={{ id: c.id }} className="hover:underline">
                    {c.full_name ?? "—"}
                  </Link>
                </td>
                <td className="p-3">{c.email}</td>
                <td className="p-3 text-right">{c.order_count}</td>
                <td className="p-3 text-right font-bold">{money(c.spent)}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
