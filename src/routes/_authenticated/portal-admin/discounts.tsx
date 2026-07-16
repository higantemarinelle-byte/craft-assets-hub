import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListDiscounts, adminSaveDiscount, adminDeleteDiscount } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-admin/discounts")({
  head: () => ({ meta: [{ title: "Discounts — Admin" }, { name: "robots", content: "noindex" }] }),
  component: DiscountsPage,
});

function DiscountsPage() {
  const fetch = useServerFn(adminListDiscounts);
  const save = useServerFn(adminSaveDiscount);
  const del = useServerFn(adminDeleteDiscount);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin:discounts"], queryFn: () => fetch() });
  const [form, setForm] = useState({ code: "", kind: "percent" as "percent" | "fixed", amount: 10, max_uses: "", expires_at: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save({ data: {
      code: form.code, kind: form.kind, amount: Number(form.amount),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      is_active: true,
    }});
    toast.success("Discount saved");
    setForm({ code: "", kind: "percent", amount: 10, max_uses: "", expires_at: "" });
    qc.invalidateQueries({ queryKey: ["admin:discounts"] });
  };

  const remove = async (id: string) => {
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin:discounts"] });
  };

  return (
    <div>
      <h1 className="text-display text-3xl">Discounts</h1>

      <form onSubmit={submit} className="mt-6 grid gap-3 rounded-lg border-2 border-ink bg-cream p-5 md:grid-cols-6">
        <div className="md:col-span-2"><Label>Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="border-2 border-ink uppercase" /></div>
        <div><Label>Kind</Label>
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as any })} className="mt-1 w-full rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm">
            <option value="percent">% off</option>
            <option value="fixed">$ off</option>
          </select>
        </div>
        <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} className="border-2 border-ink" /></div>
        <div><Label>Max uses</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} className="border-2 border-ink" /></div>
        <div><Label>Expires</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="border-2 border-ink" /></div>
        <Button type="submit" className="md:col-span-6 border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta"><Plus className="mr-1 h-4 w-4" /> Add code</Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-right">Uses</th>
              <th className="p-3 text-left">Expires</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((d: any) => (
              <tr key={d.id} className="border-t border-ink/10">
                <td className="p-3 font-bold">{d.code}</td>
                <td className="p-3">{d.kind === "percent" ? `${d.amount}% off` : `$${d.amount} off`}</td>
                <td className="p-3 text-right">{d.uses}{d.max_uses ? ` / ${d.max_uses}` : ""}</td>
                <td className="p-3 text-xs text-muted-foreground">{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : "—"}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => remove(d.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No discount codes yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
