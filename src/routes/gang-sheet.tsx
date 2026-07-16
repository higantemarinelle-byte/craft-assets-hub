import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useRef, useState, useEffect } from "react";
import { Upload, Trash2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMoney } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listActivePricingRules } from "@/lib/gang-sheet/pricing.functions";
import { calculateGangSheetPrice, type GangSheetPricingRule } from "@/lib/gang-sheet/pricing";
import { submitQuoteRequest } from "@/lib/quotes/quotes.functions";

export const Route = createFileRoute("/gang-sheet")({
  head: () => ({
    meta: [
      { title: "Gang Sheet Builder — Craft & Cling" },
      { name: "description", content: "Upload your designs, arrange them on a DTF gang sheet, get an instant price." },
      { property: "og:title", content: "Gang Sheet Builder — Craft & Cling" },
      { property: "og:description", content: "Upload your designs, arrange them on a DTF gang sheet, get an instant price." },
    ],
  }),
  component: GangSheet,
});

type Design = {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  w: number; // in inches
  h: number;
};

const PX_PER_INCH = 20; // display scale

function GangSheet() {
  const router = useRouter();
  const money = useMoney();
  const submit = useServerFn(submitQuoteRequest);
  const fetchRules = useServerFn(listActivePricingRules);
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["gang-sheet", "pricing", "public"],
    queryFn: () => fetchRules(),
  });
  const ruleList = rules as GangSheetPricingRule[];
  const [sheetCode, setSheetCode] = useState<string>("");
  const activeRule =
    ruleList.find((r) => r.code === sheetCode) ?? ruleList[0] ?? null;
  useEffect(() => {
    if (!sheetCode && activeRule) setSheetCode(activeRule.code);
  }, [activeRule, sheetCode]);

  const [designs, setDesigns] = useState<Design[]>([]);
  const [dragging, setDragging] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const sheetW = activeRule?.width_inches ?? 22;
  const sheetH = activeRule?.height_inches ?? 24;

  const usedIn2 = designs.reduce((s, d) => s + d.w * d.h, 0);
  const capIn2 = sheetW * sheetH;
  const usedPct = capIn2 > 0 ? Math.min(100, Math.round((usedIn2 / capIn2) * 100)) : 0;
  const breakdown = activeRule
    ? calculateGangSheetPrice(activeRule, { designCount: designs.length, fillPercent: usedPct })
    : null;
  const total = breakdown?.estimatedTotal ?? 0;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        setDesigns((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: f.name,
            src: reader.result as string,
            x: 0.5,
            y: 0.5,
            w: 4,
            h: 4,
          },
        ]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const board = boardRef.current?.getBoundingClientRect();
      if (!board) return;
      const xIn = (e.clientX - board.left - dragging.offX) / PX_PER_INCH;
      const yIn = (e.clientY - board.top - dragging.offY) / PX_PER_INCH;
      setDesigns((prev) =>
        prev.map((d) =>
          d.id === dragging.id
            ? {
                ...d,
                x: Math.max(0, Math.min(sheetW - d.w, xIn)),
                y: Math.max(0, Math.min(sheetH - d.h, yIn)),
              }
            : d,
        ),
      );
    };
    const up = () => setDragging(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, sheetW, sheetH]);

  const resize = (id: string, w: number) =>
    setDesigns((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const ratio = d.h / d.w;
        const newW = Math.max(1, Math.min(sheetW, w));
        return { ...d, w: newW, h: +(newW * ratio).toFixed(2) };
      }),
    );

  const [showIntake, setShowIntake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const openIntake = () => {
    if (designs.length === 0 || !activeRule) return;
    setShowIntake(true);
  };

  const sendQuote = async () => {
    if (!activeRule) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Please add your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        sheet_code: activeRule.code,
        fill_percent: usedPct,
        customer_name: form.name.trim(),
        customer_email: form.email.trim(),
        customer_phone: form.phone.trim(),
        notes: form.notes.trim(),
        designs: designs.map((d) => ({
          name: d.name,
          dataUrl: d.src,
          width_in: d.w,
          height_in: d.h,
          x_in: d.x,
          y_in: d.y,
        })),
      };
      const res = await submit({ data: payload as any });
      toast.success("Quote request sent!");
      router.navigate({ to: "/quote-submitted", search: { ref: res.reference } as any });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send quote request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-widest text-magenta">Gang sheet builder</div>
        <h1 className="text-display text-4xl md:text-5xl">Build your sheet.</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Upload PNGs, arrange them on a sheet, and get an instant quote. Fill the space to save.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Canvas */}
        <div className="rounded-lg border-2 border-ink bg-cream p-4">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="font-semibold">
              {activeRule ? `Sheet ${activeRule.name}" · ${sheetW}×${sheetH} in` : (isLoading ? "Loading pricing…" : "No pricing configured")}
            </div>
            <div className="text-muted-foreground">Utilization: <span className="font-bold text-ink">{usedPct}%</span></div>
          </div>
          <div className="overflow-auto">
            <div
              ref={boardRef}
              className="relative rounded border-2 border-dashed border-ink bg-white halftone"
              style={{ width: sheetW * PX_PER_INCH, height: sheetH * PX_PER_INCH, minWidth: 200 }}
            >
              {designs.map((d) => (
                <div
                  key={d.id}
                  onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setDragging({ id: d.id, offX: e.clientX - rect.left, offY: e.clientY - rect.top });
                  }}
                  className="absolute cursor-move overflow-hidden rounded border-2 border-magenta bg-white shadow-lg"
                  style={{
                    left: d.x * PX_PER_INCH,
                    top: d.y * PX_PER_INCH,
                    width: d.w * PX_PER_INCH,
                    height: d.h * PX_PER_INCH,
                  }}
                >
                  <img src={d.src} alt={d.name} className="h-full w-full object-contain" />
                </div>
              ))}
              {designs.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  Drag designs here after uploading →
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <aside className="space-y-4">
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest">Sheet size</div>
            <div className="grid grid-cols-2 gap-2">
              {ruleList.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setSheetCode(r.code)}
                  className={`rounded-md border-2 border-ink px-3 py-2 text-sm font-semibold ${activeRule?.code === r.code ? "bg-ink text-cream" : "bg-cream hover:bg-yellow"}`}
                >
                  {r.name}"
                </button>
              ))}
              {!isLoading && ruleList.length === 0 && (
                <div className="col-span-2 text-xs text-muted-foreground">No sheet sizes configured. Ask an owner to add pricing in Craft OS.</div>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink bg-cream p-6 text-sm font-semibold hover:bg-yellow">
            <Upload className="h-4 w-4" /> Upload PNG designs
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFile} />
          </label>

          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-widest">Designs ({designs.length})</div>
            <ul className="space-y-2 max-h-64 overflow-auto">
              {designs.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <img src={d.src} alt="" className="h-8 w-8 rounded border object-cover" />
                  <div className="flex-1 truncate text-xs">{d.name}</div>
                  <input
                    type="number"
                    min={1}
                    max={sheetW}
                    value={d.w}
                    onChange={(e) => resize(d.id, +e.target.value)}
                    className="w-14 rounded border border-ink px-1 text-xs"
                  />
                  <span className="text-xs">in</span>
                  <button onClick={() => setDesigns((p) => p.filter((x) => x.id !== d.id))} aria-label="Remove">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
              {designs.length === 0 && <li className="text-xs text-muted-foreground">No designs yet.</li>}
            </ul>
          </div>

          <div className="rounded-lg border-2 border-ink bg-ink p-5 text-cream cmyk-shadow">
            <div className="text-xs font-bold uppercase tracking-widest text-yellow">Estimated total</div>
            <div className="mt-1 text-display text-4xl">{money(total)}</div>
            {breakdown && (
              <div className="mt-2 text-xs text-cream/70">
                Sheet {money(breakdown.basePrice)} · {breakdown.designCount} designs × {money(breakdown.perDesignFee)}
                {breakdown.fillAdjustmentAmount !== 0 ? ` · fill ${breakdown.fillAdjustmentAmount > 0 ? "+" : ""}${money(breakdown.fillAdjustmentAmount)}` : ""}
                {breakdown.minimumAdjustment > 0 ? ` · min +${money(breakdown.minimumAdjustment)}` : ""}
              </div>
            )}
            <Button onClick={openIntake} disabled={designs.length === 0 || !activeRule} className="mt-4 w-full border-2 border-cream bg-magenta font-bold text-cream hover:bg-cream hover:text-ink">
              Submit quote request
            </Button>
            <p className="mt-2 flex items-start gap-1 text-[11px] text-cream/60">
              <Info className="mt-0.5 h-3 w-3 shrink-0" /> Estimate only — we'll confirm and email a printable proof.
            </p>
          </div>
        </aside>
      </div>

      {showIntake && activeRule && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => !submitting && setShowIntake(false)}>
          <div className="w-full max-w-lg rounded-lg border-2 border-ink bg-cream p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-bold uppercase tracking-widest text-magenta">Almost done</div>
            <h2 className="text-display text-2xl">Your details</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll review the artwork and confirm your quote by email.</p>

            <div className="mt-4 grid gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
              <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything we should know about colours, deadlines, etc." /></div>
            </div>

            <div className="mt-4 rounded border-2 border-ink/20 bg-white p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sheet</span><span className="font-semibold">{activeRule.name}"</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Designs</span><span className="font-semibold">{designs.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fill</span><span className="font-semibold">{usedPct}%</span></div>
              <div className="mt-1 flex justify-between border-t pt-1"><span className="text-muted-foreground">Estimated total</span><span className="font-bold">{money(total)}</span></div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowIntake(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={sendQuote} disabled={submitting} className="bg-magenta text-cream hover:bg-magenta/90">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : "Submit quote request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
