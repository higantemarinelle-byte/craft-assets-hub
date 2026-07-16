import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { placeOrder } from "@/lib/orders.functions";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Submit Project — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: Checkout,
});

const PROJECT_INFO_KEY = "cc_project_info_v1";
const CONTACT_KEY = "cc_contact_v1";

type ProjectInfo = {
  projectName: string;
  businessName: string;
  completionDate: string;
  generalNotes: string;
};
const emptyInfo: ProjectInfo = { projectName: "", businessName: "", completionDate: "", generalNotes: "" };


function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const place = useServerFn(placeOrder);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [info, setInfo] = useState<ProjectInfo>(emptyInfo);
  const [form, setForm] = useState({
    fullName: "",
    email: user?.email ?? "",
    phone: "",
    contactMethod: "Email",
    delivery: "Pickup",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECT_INFO_KEY);
      if (raw) setInfo({ ...emptyInfo, ...JSON.parse(raw) });
    } catch {}
    try {
      const raw = localStorage.getItem(CONTACT_KEY);
      if (raw) setForm((f) => ({ ...f, ...JSON.parse(raw) }));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(CONTACT_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  const summary = useMemo(() => {
    const totalItems = items.length;
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const artworkCount = items.filter((i) => i.artwork).length;
    return { totalItems, totalQty, artworkCount };
  }, [items]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-display text-3xl">Sign in to submit your project</h1>
        <p className="mt-2 text-muted-foreground">Create an account or log in so we can follow up with you about your project.</p>
        <Link to="/auth" search={{ redirect: "/checkout" } as never} className="mt-6 inline-block rounded-md border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream hover:bg-magenta hover:border-magenta">
          Sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-display text-3xl">Nothing to submit yet</h1>
        <Link to="/shop" className="mt-6 inline-block underline">Explore designs</Link>
      </div>
    );
  }

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.phone.trim().length < 6) e.phone = "Enter a valid phone number.";
    if (!form.contactMethod) e.contactMethod = "Choose a contact method.";
    if (!form.delivery) e.delivery = "Choose a delivery method.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await place({
        data: {
          email: form.email,
          fullName: form.fullName,
          project: {
            phone: form.phone,
            contactMethod: form.contactMethod,
            delivery: form.delivery,
            completionDate: info.completionDate || undefined,
            notes: info.generalNotes || undefined,
            projectName: info.projectName || undefined,
            businessName: info.businessName || undefined,
            generalNotes: info.generalNotes || undefined,
            itemDetails: items.map((i) => ({
              variantId: i.variantId,
              notes: i.notes,
              artwork: i.artwork ? { name: i.artwork.name, size: i.artwork.size, type: i.artwork.type } : undefined,
              reference: i.reference ? { name: i.reference.name, size: i.reference.size, type: i.reference.type } : undefined,
            })),
          },
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        },
      });
      const reference = result.reference;
      const contactMethod = form.contactMethod;
      const completion = info.completionDate;
      clear();
      try {
        localStorage.removeItem(PROJECT_INFO_KEY);
      } catch {}
      toast.success("Project submitted!", { description: `Reference ${reference}` });
      navigate({
        to: "/project-submitted",
        search: {
          ref: reference,
          contact: contactMethod,
          completion: completion || undefined,
        } as never,
      });
    } catch (err: any) {
      toast.error("Could not submit project", { description: err?.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-3 md:px-6">
      <form onSubmit={onSubmit} noValidate className="md:col-span-2 space-y-6">
        <div>
          <h1 className="text-display text-3xl">Submit Your Project</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We're excited to work on your project. Share how you'd like to be contacted and our team will get back to you within 24 hours.
          </p>
        </div>

        <fieldset className="space-y-4 rounded-lg border-2 border-ink bg-cream p-5">
          <legend className="px-2 text-xs font-bold uppercase tracking-widest">Contact</legend>
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" required value={form.fullName} onChange={setField("fullName")} className="border-2 border-ink" aria-invalid={!!errors.fullName} />
            {errors.fullName && <p className="mt-1 text-xs text-destructive">{errors.fullName}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={setField("email")} className="border-2 border-ink" aria-invalid={!!errors.email} />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" required value={form.phone} onChange={setField("phone")} className="border-2 border-ink" aria-invalid={!!errors.phone} />
            {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div>
            <Label>Preferred contact method</Label>
            <Select value={form.contactMethod} onValueChange={(v) => setForm({ ...form, contactMethod: v })}>
              <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Messenger">Messenger</SelectItem>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Viber">Viber</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preferred delivery method</Label>
            <Select value={form.delivery} onValueChange={(v) => setForm({ ...form, delivery: v })}>
              <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pickup">Pickup</SelectItem>
                <SelectItem value="Shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </fieldset>

        <div className="rounded-lg border-2 border-dashed border-ink/40 bg-cream/50 p-4 text-sm text-ink/75">
          Need to change artwork, item notes, or project info? <Link to="/cart" className="font-bold underline hover:text-magenta">Edit your project</Link>.
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
          {submitting ? "Submitting…" : "Submit Project"}
        </Button>
      </form>

      <aside className="h-fit space-y-4">
        <div className="rounded-lg border-2 border-ink bg-cream p-5">
          <div className="text-xs font-bold uppercase tracking-widest">Project Summary</div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Total items</dt><dd className="font-bold">{summary.totalItems}</dd></div>
            <div className="flex justify-between"><dt>Estimated quantity</dt><dd className="font-bold">{summary.totalQty}</dd></div>
            <div className="flex justify-between">
              <dt>Artwork uploaded</dt>
              <dd className="font-bold inline-flex items-center gap-1">
                {summary.artworkCount > 0 ? <><FileCheck2 className="h-4 w-4 text-magenta" /> Yes ({summary.artworkCount}/{summary.totalItems})</> : "No"}
              </dd>
            </div>
            <div className="flex justify-between"><dt>Preferred completion</dt><dd className="font-bold">{info.completionDate || "—"}</dd></div>
            {info.projectName && <div className="flex justify-between"><dt>Project</dt><dd className="font-bold">{info.projectName}</dd></div>}
          </dl>

          <ul className="mt-5 space-y-3 border-t-2 border-ink pt-4">
            {items.map((i) => (
              <li key={i.variantId} className="flex items-start justify-between text-sm">
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.variantLabel} × {i.quantity}</div>
                </div>
                <div className="font-bold">{money(i.price * i.quantity)}</div>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t-2 border-ink pt-3">
            <div className="text-xs font-bold uppercase tracking-widest">Estimated Project Value</div>
            <div className="mt-1 text-2xl font-bold">{money(subtotal)}</div>
            <p className="mt-2 text-xs italic text-muted-foreground">Subject to review — our team confirms final pricing after reviewing your artwork.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
