import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  adminListPricingRules,
  adminSavePricingRule,
  adminDeletePricingRule,
} from "@/lib/gang-sheet/pricing.functions";
import {
  calculateGangSheetPrice,
  fillAdjustmentLabel,
  FILL_ADJUSTMENT_TYPES,
  type FillAdjustmentType,
  type GangSheetPricingRule,
} from "@/lib/gang-sheet/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { money } from "@/lib/format";
import { useTheme } from "@/lib/theme-context";

export const Route = createFileRoute("/_authenticated/portal-admin/gang-sheet/pricing")({
  head: () => ({ meta: [{ title: "Gang Sheet Pricing — Craft OS" }, { name: "robots", content: "noindex" }] }),
  component: PricingPage,
});

type Draft = Partial<GangSheetPricingRule> & { fill_adjustment_type: FillAdjustmentType };

function blank(): Draft {
  return {
    code: "",
    name: "",
    width_inches: null,
    height_inches: null,
    currency: "USD",
    base_price: 0,
    per_design_fee: 0,
    fill_adjustment_type: "none",
    fill_threshold_percent: null,
    fill_adjustment_value: 0,
    minimum_total: 0,
    is_active: true,
    sort_order: 0,
  };
}

function PricingPage() {
  const { theme } = useTheme();
  const themeCurrency = theme.commerce?.currency ?? "USD";
  const list = useServerFn(adminListPricingRules);
  const save = useServerFn(adminSavePricingRule);
  const del = useServerFn(adminDeletePricingRule);
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["gang-sheet", "pricing", "admin"],
    queryFn: () => list(),
  });
  const rules = data as GangSheetPricingRule[];
  const [editing, setEditing] = useState<Draft | null>(null);
  const [previewDesigns, setPreviewDesigns] = useState(5);
  const [previewFill, setPreviewFill] = useState(50);
  const [previewCode, setPreviewCode] = useState<string>("");

  const previewRule = useMemo(
    () => rules.find((r) => r.code === previewCode) ?? rules[0],
    [rules, previewCode],
  );
  const previewBreakdown = useMemo(
    () => (previewRule ? calculateGangSheetPrice(previewRule, { designCount: previewDesigns, fillPercent: previewFill }) : null),
    [previewRule, previewDesigns, previewFill],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["gang-sheet", "pricing", "admin"] });
    qc.invalidateQueries({ queryKey: ["gang-sheet", "pricing", "public"] });
  };

  const submit = async (draft: Draft) => {
    try {
      await save({ data: draft as any });
      toast.success("Pricing rule saved");
      setEditing(null);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };
  const onDelete = async (r: GangSheetPricingRule) => {
    if (!confirm(`Delete "${r.name}"? Existing quote requests keep their saved pricing snapshot.`)) return;
    try {
      await del({ data: { id: r.id } });
      toast.success("Deleted");
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gang Sheet Pricing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Controls the estimated total on the public Gang Sheet Builder. Historical quote requests keep the pricing that was active when they were submitted.
          </p>
        </div>
        <Button onClick={() => setEditing(blank())}>
          <Plus className="mr-1 h-4 w-4" /> New sheet size
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 text-left">Sheet</th>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-right">Base</th>
                <th className="p-3 text-right">Per design</th>
                <th className="p-3 text-left">Fill adj.</th>
                <th className="p-3 text-right">Min total</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-right">Order</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">Loading…</td></tr>
              )}
              {!isLoading && rules.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">No pricing rules yet.</td></tr>
              )}
              {rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.code}</div>
                  </td>
                  <td className="p-3 text-slate-600">
                    {r.width_inches && r.height_inches ? `${r.width_inches}×${r.height_inches} in` : "—"}
                  </td>
                  <td className="p-3 text-right">{money(r.base_price)}</td>
                  <td className="p-3 text-right">{money(r.per_design_fee)}</td>
                  <td className="p-3 text-xs">
                    {r.fill_adjustment_type === "none" ? "—" : (
                      <div>
                        <div>{fillAdjustmentLabel(r.fill_adjustment_type)}</div>
                        <div className="text-slate-500">
                          value {r.fill_adjustment_value}
                          {r.fill_threshold_percent != null ? ` · ≥ ${r.fill_threshold_percent}%` : ""}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">{r.minimum_total > 0 ? money(r.minimum_total) : "—"}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {r.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-3 text-right">{r.sort_order}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <button title="Edit" onClick={() => setEditing(r as Draft)} className="rounded p-1 text-slate-600 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button title="Delete" onClick={() => onDelete(r)} className="rounded p-1 text-slate-600 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Preview calculator */}
        <aside className="rounded-lg border bg-white p-4">
          <div className="text-sm font-semibold">Preview calculator</div>
          <p className="mt-1 text-xs text-slate-500">
            Uses the same pricing service as the public storefront and the server-side validator.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Sheet</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
                value={previewRule?.code ?? ""}
                onChange={(e) => setPreviewCode(e.target.value)}
              >
                {rules.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600"># of designs</span>
              <Input type="number" min={0} value={previewDesigns} onChange={(e) => setPreviewDesigns(Math.max(0, +e.target.value || 0))} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Fill %</span>
              <Input type="number" min={0} max={100} value={previewFill} onChange={(e) => setPreviewFill(Math.max(0, Math.min(100, +e.target.value || 0)))} />
            </label>
          </div>
          {previewBreakdown && (
            <div className="mt-4 rounded bg-slate-50 p-3 text-xs">
              <div className="flex justify-between"><span>Base</span><span>{money(previewBreakdown.basePrice)}</span></div>
              <div className="flex justify-between"><span>{previewBreakdown.designCount} × {money(previewBreakdown.perDesignFee)}</span><span>{money(previewBreakdown.designsSubtotal)}</span></div>
              {previewBreakdown.fillAdjustmentAmount !== 0 && (
                <div className="flex justify-between"><span>Fill adjustment</span><span>{money(previewBreakdown.fillAdjustmentAmount)}</span></div>
              )}
              {previewBreakdown.minimumAdjustment > 0 && (
                <div className="flex justify-between"><span>Minimum top-up</span><span>{money(previewBreakdown.minimumAdjustment)}</span></div>
              )}
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Estimated total</span><span>{money(previewBreakdown.estimatedTotal)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      {editing && <EditDialog draft={editing} onCancel={() => setEditing(null)} onSave={submit} />}
    </div>
  );
}

function EditDialog({ draft, onCancel, onSave }: { draft: Draft; onCancel: () => void; onSave: (d: Draft) => void }) {
  const [d, setD] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  const submit = () => {
    const payload: any = {
      ...d,
      base_price: Number(d.base_price ?? 0),
      per_design_fee: Number(d.per_design_fee ?? 0),
      fill_adjustment_value: Number(d.fill_adjustment_value ?? 0),
      minimum_total: Number(d.minimum_total ?? 0),
      width_inches: d.width_inches == null || d.width_inches === ("" as any) ? null : Number(d.width_inches),
      height_inches: d.height_inches == null || d.height_inches === ("" as any) ? null : Number(d.height_inches),
      fill_threshold_percent:
        d.fill_threshold_percent == null || d.fill_threshold_percent === ("" as any)
          ? null : Number(d.fill_threshold_percent),
      sort_order: Number(d.sort_order ?? 0),
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{d.id ? "Edit sheet" : "New sheet"}</h2>
          <button onClick={onCancel} className="rounded p-1 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><Label>Name</Label><Input value={d.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label>Code</Label><Input value={d.code ?? ""} onChange={(e) => set("code", e.target.value)} placeholder="sheet-22x24" /></div>
          <div><Label>Width (in)</Label><Input type="number" value={d.width_inches ?? ("" as any)} onChange={(e) => set("width_inches", e.target.value === "" ? null : +e.target.value)} /></div>
          <div><Label>Height (in)</Label><Input type="number" value={d.height_inches ?? ("" as any)} onChange={(e) => set("height_inches", e.target.value === "" ? null : +e.target.value)} /></div>
          <div><Label>Currency</Label><Input value={d.currency ?? "USD"} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></div>
          <div><Label>Base price</Label><Input type="number" step="0.01" value={d.base_price ?? 0} onChange={(e) => set("base_price", +e.target.value)} /></div>
          <div><Label>Per-design fee</Label><Input type="number" step="0.01" value={d.per_design_fee ?? 0} onChange={(e) => set("per_design_fee", +e.target.value)} /></div>
          <div><Label>Minimum total</Label><Input type="number" step="0.01" value={d.minimum_total ?? 0} onChange={(e) => set("minimum_total", +e.target.value)} /></div>
          <div>
            <Label>Fill adjustment type</Label>
            <select
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
              value={d.fill_adjustment_type}
              onChange={(e) => set("fill_adjustment_type", e.target.value as FillAdjustmentType)}
            >
              {FILL_ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{fillAdjustmentLabel(t)}</option>)}
            </select>
          </div>
          <div><Label>Fill adjustment value</Label><Input type="number" step="0.01" value={d.fill_adjustment_value ?? 0} onChange={(e) => set("fill_adjustment_value", +e.target.value)} /></div>
          <div><Label>Fill threshold %</Label><Input type="number" min={0} max={100} value={d.fill_threshold_percent ?? ("" as any)} onChange={(e) => set("fill_threshold_percent", e.target.value === "" ? null : +e.target.value)} placeholder="Leave blank for all fills" /></div>
          <div><Label>Sort order</Label><Input type="number" value={d.sort_order ?? 0} onChange={(e) => set("sort_order", +e.target.value)} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <input id="active" type="checkbox" checked={!!d.is_active} onChange={(e) => set("is_active", e.target.checked)} />
            <label htmlFor="active" className="text-sm">Active (visible on the public builder)</label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  );
}