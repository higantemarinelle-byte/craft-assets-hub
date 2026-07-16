import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { adminGetQuoteRequest, adminUpdateQuoteRequest } from "@/lib/quotes/quotes.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portal-admin/quote-requests/$id")({
  head: () => ({ meta: [{ title: "Quote Request — Craft OS" }, { name: "robots", content: "noindex" }] }),
  component: QuoteRequestDetail,
});

const STATUSES = ["submitted", "reviewing", "quoted", "approved", "declined", "converted"] as const;

function QuoteRequestDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetQuoteRequest);
  const updateFn = useServerFn(adminUpdateQuoteRequest);

  const { data, isLoading } = useQuery({
    queryKey: ["quote-requests", "admin", id],
    queryFn: () => getFn({ data: { id } }),
  });
  const row = data as any;

  const [status, setStatus] = useState<string>("submitted");
  const [quoted, setQuoted] = useState<string>("");
  const [quoteNotes, setQuoteNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setStatus(row.status ?? "submitted");
    setQuoted(row.quoted_total != null ? String(row.quoted_total) : "");
    setQuoteNotes(row.quote_notes ?? "");
  }, [row]);

  if (isLoading || !row) {
    return <div className="p-6 text-slate-500">Loading…</div>;
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id,
          status: status as any,
          quoted_total: quoted === "" ? null : Number(quoted),
          quote_notes: quoteNotes || null,
        } as any,
      });
      toast.success("Quote updated");
      qc.invalidateQueries({ queryKey: ["quote-requests"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const snap = row.pricing_snapshot ?? {};

  return (
    <div>
      <Link to="/portal-admin/quote-requests" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> All quote requests
      </Link>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Quote {row.reference}</h1>
          <p className="text-sm text-slate-500">
            Submitted {new Date(row.created_at).toLocaleString()}
          </p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold capitalize">{row.status}</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,340px]">
        <div className="space-y-6">
          <Section title="Customer">
            <Field label="Name" value={row.customer_name} />
            <Field label="Email" value={<a href={`mailto:${row.customer_email}`} className="text-magenta underline">{row.customer_email}</a>} />
            <Field label="Phone" value={row.customer_phone || "—"} />
            <Field label="Notes" value={<div className="whitespace-pre-wrap text-sm">{row.notes || "—"}</div>} />
          </Section>

          <Section title="Sheet & pricing snapshot">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sheet" value={`${row.sheet_name} · ${row.sheet_width_inches ?? "?"}×${row.sheet_height_inches ?? "?"} in`} />
              <Field label="Design count" value={row.design_count} />
              <Field label="Fill" value={`${Number(row.fill_percent).toFixed(0)}%`} />
              <Field label="Currency" value={row.currency} />
              <Field label="Base" value={money(Number(snap.basePrice ?? 0), row.currency)} />
              <Field label="Per-design fee" value={money(Number(snap.perDesignFee ?? 0), row.currency)} />
              <Field label="Fill adjustment" value={money(Number(snap.fillAdjustmentAmount ?? 0), row.currency)} />
              <Field label="Minimum top-up" value={money(Number(snap.minimumAdjustment ?? 0), row.currency)} />
              <Field label="Estimated total" value={<span className="text-lg font-bold">{money(Number(row.estimated_total ?? 0), row.currency)}</span>} />
            </div>
          </Section>

          <Section title={`Artwork (${row.designs?.length ?? 0})`}>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(row.designs ?? []).map((d: any, i: number) => (
                <div key={i} className="rounded border border-slate-200 bg-slate-50 p-2">
                  {d.signed_url ? (
                    <a href={d.signed_url} target="_blank" rel="noreferrer">
                      <img src={d.signed_url} alt={d.name} className="h-40 w-full rounded object-contain bg-white" />
                    </a>
                  ) : (
                    <div className="grid h-40 place-items-center text-xs text-rose-600">Upload failed</div>
                  )}
                  <div className="mt-2 truncate text-xs font-medium">{d.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {Number(d.width_in ?? 0).toFixed(2)}×{Number(d.height_in ?? 0).toFixed(2)} in
                  </div>
                </div>
              ))}
              {(row.designs ?? []).length === 0 && <div className="text-sm text-slate-500">No artwork attached.</div>}
            </div>
          </Section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm font-semibold">Manage quote</div>
            <div className="mt-3 space-y-3">
              <div>
                <Label>Status</Label>
                <select className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm capitalize" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Quoted total ({row.currency})</Label>
                <Input type="number" step="0.01" value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="Leave blank to use estimate" />
                <div className="mt-1 text-[11px] text-slate-500">Estimate: {money(Number(row.estimated_total ?? 0), row.currency)}</div>
              </div>
              <div>
                <Label>Internal notes / owner message</Label>
                <Textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} rows={5} />
              </div>
              <Button onClick={save} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}