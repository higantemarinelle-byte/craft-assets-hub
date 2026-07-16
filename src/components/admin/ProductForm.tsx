import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminSaveProduct, adminListCategories } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type Variant = { id?: string; label: string; price: number; stock: number; sort_order: number };
type Initial = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string | null;
  care_instructions?: string | null;
  category_id?: string | null;
  base_price?: number;
  images?: string[];
  tags?: string[];
  is_featured?: boolean;
  is_published?: boolean;
  product_variants?: Variant[];
} | null;

export function ProductForm({ initial, onSaved }: { initial: Initial; onSaved: () => void }) {
  const save = useServerFn(adminSaveProduct);
  const fetchCats = useServerFn(adminListCategories);
  const { data: categories = [] } = useQuery({ queryKey: ["admin:cats"], queryFn: () => fetchCats() });

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    care_instructions: initial?.care_instructions ?? "",
    category_id: initial?.category_id ?? "",
    base_price: initial?.base_price ?? 0,
    images: (initial?.images ?? []).join("\n"),
    tags: (initial?.tags ?? []).join(", "),
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
  });
  const [variants, setVariants] = useState<Variant[]>(
    initial?.product_variants ?? [{ label: "Default", price: 0, stock: 0, sort_order: 0 }],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form.slug && form.name) {
      setForm((f) => ({ ...f, slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
    }
  }, [form.name, form.slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save({
        data: {
          id: initial?.id,
          slug: form.slug,
          name: form.name,
          description: form.description || null,
          care_instructions: form.care_instructions || null,
          category_id: form.category_id || null,
          base_price: Number(form.base_price),
          images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
          tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
          is_featured: form.is_featured,
          is_published: form.is_published,
          variants: variants.map((v, i) => ({ ...v, price: Number(v.price), stock: Number(v.stock), sort_order: i })),
        },
      });
      toast.success("Saved");
      onSaved();
    } catch (err: any) {
      toast.error("Could not save", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <h1 className="text-display text-3xl">{initial?.id ? "Edit product" : "New product"}</h1>

      <div className="grid gap-4 rounded-lg border-2 border-ink bg-cream p-5 md:grid-cols-2">
        <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-2 border-ink" /></div>
        <div><Label>Slug</Label><Input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border-2 border-ink" /></div>
        <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-2 border-ink" /></div>
        <div className="md:col-span-2"><Label>Care / application</Label><Textarea value={form.care_instructions ?? ""} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} className="border-2 border-ink" /></div>
        <div>
          <Label>Category</Label>
          <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="mt-1 w-full rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm">
            <option value="">— none —</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><Label>Base price ($)</Label><Input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: +e.target.value })} className="border-2 border-ink" /></div>
        <div className="md:col-span-2"><Label>Images (one URL per line)</Label><Textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="border-2 border-ink font-mono text-xs" rows={3} /></div>
        <div className="md:col-span-2"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="border-2 border-ink" /></div>
        <div className="flex items-center gap-3"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured / best-seller</Label></div>
        <div className="flex items-center gap-3"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
      </div>

      <div className="rounded-lg border-2 border-ink bg-cream p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-widest">Variants</div>
          <Button type="button" size="sm" variant="outline" className="border-2 border-ink" onClick={() => setVariants((v) => [...v, { label: "", price: 0, stock: 0, sort_order: v.length }])}>
            <Plus className="mr-1 h-3 w-3" /> Add variant
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-[1fr,120px,100px,40px] gap-2">
              <Input placeholder="e.g. 12x12" value={v.label} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} className="border-2 border-ink" />
              <Input type="number" step="0.01" placeholder="Price" value={v.price} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, price: +e.target.value } : x))} className="border-2 border-ink" />
              <Input type="number" placeholder="Stock" value={v.stock} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, stock: +e.target.value } : x))} className="border-2 border-ink" />
              <Button type="button" size="icon" variant="ghost" onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={saving} size="lg" className="border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
        {saving ? "Saving…" : "Save product"}
      </Button>
    </form>
  );
}
