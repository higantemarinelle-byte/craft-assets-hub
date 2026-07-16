import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, FileCheck2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AttachmentUpload } from "@/components/site/AttachmentUpload";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Project Cart — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: Cart,
});

const PROJECT_INFO_KEY = "cc_project_info_v1";

type ProjectInfo = {
  projectName: string;
  businessName: string;
  completionDate: string;
  generalNotes: string;
};

const emptyInfo: ProjectInfo = { projectName: "", businessName: "", completionDate: "", generalNotes: "" };

const ARTWORK_ACCEPT = ".png,.jpg,.jpeg,.pdf,.ai,.psd,.svg,image/*,application/pdf,application/postscript";
const ARTWORK_HELPER = "Accepted: PNG, JPG, PDF, AI, PSD, SVG · Max 25MB. Don't worry if your artwork isn't perfect — we'll review it and reach out with any suggestions before printing.";

function Cart() {
  const { items, setQty, remove, updateItem } = useCart();
  const [info, setInfo] = useState<ProjectInfo>(emptyInfo);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECT_INFO_KEY);
      if (raw) setInfo({ ...emptyInfo, ...JSON.parse(raw) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(PROJECT_INFO_KEY, JSON.stringify(info)); } catch {}
  }, [info]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-display text-4xl">Your project is empty</h1>
        <p className="mt-2 text-muted-foreground">Add designs to start building your custom project. We're excited to work with you.</p>
        <Link to="/shop" className="mt-6 inline-block rounded-md border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream hover:bg-magenta hover:border-magenta">
          Explore Designs
        </Link>
      </div>
    );
  }

  const totalItems = items.length;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const artworkCount = items.filter((i) => i.artwork).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="text-display text-4xl">Project Builder</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Add artwork, notes, and details for each item. Our team carefully reviews every project — final pricing is confirmed after review, no payment collected here.
      </p>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <div key={item.variantId} className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded border-2 border-ink bg-gradient-to-br from-cyan via-magenta to-yellow">
                {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link to="/shop/$slug" params={{ slug: item.slug }} className="font-semibold hover:text-magenta">
                  {item.name}
                </Link>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{item.variantLabel}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-magenta">Quoted after review</div>
              </div>
              <div className="flex items-center rounded-md border-2 border-ink">
                <button onClick={() => setQty(item.variantId, item.quantity - 1)} className="px-3 py-1 font-bold">−</button>
                <div className="w-8 text-center font-bold">{item.quantity}</div>
                <button onClick={() => setQty(item.variantId, item.quantity + 1)} className="px-3 py-1 font-bold">+</button>
              </div>
              <div className="hidden w-20 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:block">Quote</div>
              <button onClick={() => remove(item.variantId)} aria-label="Remove" className="rounded p-2 text-muted-foreground hover:bg-ink/5 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AttachmentUpload
                label="Artwork"
                accept={ARTWORK_ACCEPT}
                value={item.artwork}
                onChange={(a) => updateItem(item.variantId, { artwork: a })}
                helper={ARTWORK_HELPER}
              />
              <AttachmentUpload
                label="Reference image"
                accept="image/*"
                value={item.reference}
                onChange={(a) => updateItem(item.variantId, { reference: a })}
                helper="Optional — a photo or mockup showing placement or style you like."
              />
            </div>

            <div className="mt-4">
              <Label className="text-xs font-bold uppercase tracking-widest">Item notes</Label>
              <Textarea
                value={item.notes ?? ""}
                onChange={(e) => updateItem(item.variantId, { notes: e.target.value })}
                placeholder="e.g. Front logo should be exactly 4 inches wide, centered."
                className="mt-2 min-h-20 border-2 border-ink"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Project information */}
      <section className="mt-10 rounded-lg border-2 border-ink bg-cream p-5">
        <h2 className="text-display text-2xl">Project Information</h2>
        <p className="mt-1 text-sm text-muted-foreground">Help us understand the bigger picture. All fields optional — share what's useful.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="projectName">Project name</Label>
            <Input id="projectName" placeholder="e.g. Summer Uniforms" value={info.projectName}
              onChange={(e) => setInfo({ ...info, projectName: e.target.value })} className="border-2 border-ink" />
          </div>
          <div>
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" placeholder="If this is for a business" value={info.businessName}
              onChange={(e) => setInfo({ ...info, businessName: e.target.value })} className="border-2 border-ink" />
          </div>
          <div>
            <Label htmlFor="completionDate">Preferred completion date</Label>
            <Input id="completionDate" type="date" value={info.completionDate}
              onChange={(e) => setInfo({ ...info, completionDate: e.target.value })} className="border-2 border-ink" />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="generalNotes">General project notes</Label>
          <Textarea
            id="generalNotes"
            value={info.generalNotes}
            onChange={(e) => setInfo({ ...info, generalNotes: e.target.value })}
            placeholder="e.g. Need before July 30. Please match the blue from our company logo."
            className="mt-2 min-h-28 border-2 border-ink"
          />
        </div>
      </section>

      {/* Summary */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border-2 border-ink bg-cream p-5">
          <div className="text-xs font-bold uppercase tracking-widest">Project Summary</div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Total items</dt><dd className="font-bold">{totalItems}</dd></div>
            <div className="flex justify-between"><dt>Estimated quantity</dt><dd className="font-bold">{totalQty}</dd></div>
            <div className="flex justify-between">
              <dt>Artwork uploaded</dt>
              <dd className="font-bold inline-flex items-center gap-1">
                {artworkCount > 0 ? <><FileCheck2 className="h-4 w-4 text-magenta" /> Yes ({artworkCount}/{totalItems})</> : "No"}
              </dd>
            </div>
            <div className="flex justify-between"><dt>Preferred completion</dt><dd className="font-bold">{info.completionDate || "—"}</dd></div>
          </dl>
        </div>

        <div className="rounded-lg border-2 border-ink bg-cream p-5">
          <div className="text-xs font-bold uppercase tracking-widest">Quotation</div>
          <div className="mt-2 text-xl font-bold">We'll quote your project after review</div>
          <div className="mt-1 text-xs italic text-muted-foreground">No online payments. Our team reviews your artwork and details, then sends a quote — production starts after you approve it.</div>
          <div className="mt-5 flex flex-col gap-2">
            <Link to="/checkout">
              <Button size="lg" className="w-full border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
                Continue to Contact Details →
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant="outline" size="lg" className="w-full border-2 border-ink font-bold hover:bg-yellow">
                Keep Exploring
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
