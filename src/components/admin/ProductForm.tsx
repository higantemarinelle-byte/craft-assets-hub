import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSaveProduct, adminListCategories } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/admin/craft-studio/MediaPicker";
import { Trash2, Plus, ArrowUp, ArrowDown, ImagePlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { resolvePublicAssets } from "@/lib/storefront/assets.functions";

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

type SaveMode = "close" | "continue";

const ARCHIVED_TAG = "archived";

export function ProductForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Initial;
  onSaved: (id: string, mode: SaveMode) => void;
  onCancel?: () => void;
}) {
  const save = useServerFn(adminSaveProduct);
  const fetchCats = useServerFn(adminListCategories);
  const qc = useQueryClient();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "catalog", "categories"],
    queryFn: () => fetchCats(),
  });

  const initialTags = initial?.tags ?? [];
  const initialStatus: "active" | "archived" = initialTags.includes(ARCHIVED_TAG) ? "archived" : "active";

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    care_instructions: initial?.care_instructions ?? "",
    category_id: initial?.category_id ?? "",
    base_price: initial?.base_price ?? 0,
    tags: initialTags.filter((t) => t !== ARCHIVED_TAG).join(", "),
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
    status: initialStatus,
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(
    initial?.product_variants?.length
      ? initial.product_variants
      : [{ label: "Default", price: 0, stock: 0, sort_order: 0 }],
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Auto-derive slug from name for new products.
  useEffect(() => {
    if (!initial?.id && form.name && !form.slug) {
      setForm((f) => ({
        ...f,
        slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      }));
    }
  }, [form.name, form.slug, initial?.id]);

  // Mark dirty on any state change after mount.
  useEffect(() => {
    setDirty(true);
  }, [form, images, variants]);
  // Reset dirty flag once on mount.
  useEffect(() => {
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn on browser navigation with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const patchField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const invalidateCatalog = () => {
    qc.invalidateQueries({ queryKey: ["admin", "catalog", "products"] });
    qc.invalidateQueries({ queryKey: ["admin", "catalog", "product"] });
    // Legacy admin keys (still referenced from list page).
    qc.invalidateQueries({ queryKey: ["admin:products"] });
    qc.invalidateQueries({ queryKey: ["admin:product"] });
    // Storefront caches.
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
    qc.invalidateQueries({ queryKey: ["product:related"] });
    qc.invalidateQueries({ queryKey: ["catalog", "products"] });
    qc.invalidateQueries({ queryKey: ["catalog", "featured"] });
  };

  const submit = async (e: React.FormEvent, mode: SaveMode) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    for (const v of variants) {
      if (!v.label.trim()) {
        toast.error("Every variant needs a label");
        return;
      }
    }
    setSaving(true);
    try {
      const cleanTags = form.tags.split(",").map((s) => s.trim()).filter(Boolean);
      const isArchived = form.status === "archived";
      const finalTags = isArchived
        ? [...cleanTags.filter((t) => t !== ARCHIVED_TAG), ARCHIVED_TAG]
        : cleanTags.filter((t) => t !== ARCHIVED_TAG);
      const finalPublished = isArchived ? false : form.is_published;

      const result = await save({
        data: {
          id: initial?.id,
          slug: form.slug,
          name: form.name,
          description: form.description || null,
          care_instructions: form.care_instructions || null,
          category_id: form.category_id || null,
          base_price: Number(form.base_price),
          images,
          tags: finalTags,
          is_featured: finalPublished ? form.is_featured : false,
          is_published: finalPublished,
          variants: variants.map((v, i) => ({
            ...v,
            price: Number(v.price),
            stock: Number(v.stock),
            sort_order: i,
          })),
        },
      });
      toast.success("Product saved");
      setDirty(false);
      invalidateCatalog();
      onSaved(result.id, mode);
    } catch (err: any) {
      toast.error("Could not save product", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const requestCancel = () => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    onCancel?.();
  };

  const moveVariant = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= variants.length) return;
    const next = variants.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    setVariants(next);
  };

  const canPreview = !!(initial?.id && form.slug && !dirty && form.status === "active" && form.is_published);

  return (
    <form onSubmit={(e) => submit(e, "close")} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-3xl">
          {initial?.id ? "Edit pre-made product" : "New pre-made product"}
        </h1>
        <div className="flex flex-wrap gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={requestCancel} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={!canPreview}
            title={canPreview ? "Open the storefront page" : "Save the product and set it Active to preview"}
            onClick={() => window.open(`/shop/${form.slug}`, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="mr-1 h-4 w-4" /> Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={(e) => submit(e as any, "continue")}
          >
            {saving ? "Saving…" : "Save and continue editing"}
          </Button>
          <Button type="submit" disabled={saving} className="border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border-2 border-ink bg-cream p-5 md:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input required value={form.name} onChange={(e) => patchField("name", e.target.value)} className="border-2 border-ink" />
        </div>
        <div>
          <Label>Slug</Label>
          <Input required value={form.slug} onChange={(e) => patchField("slug", e.target.value)} className="border-2 border-ink" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Textarea value={form.description ?? ""} onChange={(e) => patchField("description", e.target.value)} className="border-2 border-ink" rows={4} />
        </div>
        <div className="md:col-span-2">
          <Label>Care / application</Label>
          <Textarea value={form.care_instructions ?? ""} onChange={(e) => patchField("care_instructions", e.target.value)} className="border-2 border-ink" />
        </div>
        <div>
          <Label>Category</Label>
          <select
            value={form.category_id ?? ""}
            onChange={(e) => patchField("category_id", e.target.value)}
            className="mt-1 w-full rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm"
          >
            <option value="">— none —</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Base price ($)</Label>
          <Input type="number" step="0.01" value={form.base_price} onChange={(e) => patchField("base_price", +e.target.value as any)} className="border-2 border-ink" />
        </div>
        <div className="md:col-span-2">
          <Label>Tags (comma-separated)</Label>
          <Input value={form.tags} onChange={(e) => patchField("tags", e.target.value)} className="border-2 border-ink" placeholder="e.g. summer, new" />
        </div>

        <div className="md:col-span-2 grid gap-4 rounded-md border-2 border-ink/10 bg-white p-4 md:grid-cols-3">
          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => patchField("status", e.target.value as "active" | "archived")}
              className="mt-1 w-full rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="archived">Archived (hidden)</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Archived products stay editable but never appear on the storefront.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={(v) => patchField("is_published", v)} disabled={form.status === "archived"} />
              <Label>Live on storefront</Label>
            </div>
            <p className="text-xs text-muted-foreground">Turn off to save as a draft.</p>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-3">
              <Switch checked={form.is_featured} onCheckedChange={(v) => patchField("is_featured", v)} disabled={form.status === "archived" || !form.is_published} />
              <Label>Show in Popular Designs</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Adds this product to the homepage “Popular Designs” section.
            </p>
          </div>
        </div>
      </div>

      <ImagesEditor images={images} onChange={setImages} />

      <div className="rounded-lg border-2 border-ink bg-cream p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold uppercase tracking-widest">Variants</div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-2 border-ink"
            onClick={() => setVariants((v) => [...v, { label: "", price: 0, stock: 0, sort_order: v.length }])}
          >
            <Plus className="mr-1 h-3 w-3" /> Add variant
          </Button>
        </div>
        <div className="space-y-2">
          {variants.map((v, idx) => (
            <div key={v.id ?? `new-${idx}`} className="grid grid-cols-[64px,1fr,120px,100px,40px] items-center gap-2">
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => moveVariant(idx, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => moveVariant(idx, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
              </div>
              <Input placeholder="e.g. 12x12" value={v.label} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))} className="border-2 border-ink" />
              <Input type="number" step="0.01" placeholder="Price" value={v.price} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, price: +e.target.value } : x))} className="border-2 border-ink" />
              <Input type="number" placeholder="Stock" value={v.stock} onChange={(e) => setVariants((prev) => prev.map((x, i) => i === idx ? { ...x, stock: +e.target.value } : x))} className="border-2 border-ink" />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Delete variant"
                onClick={() => {
                  if (variants.length === 1) {
                    toast.error("A product needs at least one variant");
                    return;
                  }
                  if (!confirm(`Delete variant "${v.label || "(unnamed)"}"?`)) return;
                  setVariants((prev) => prev.filter((_, i) => i !== idx));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Images editor — mixes MediaPicker (Asset IDs) and legacy raw URLs.
// ---------------------------------------------------------------------------

const ASSET_PREFIX = "asset:";
function isAssetRef(value: string) {
  return value.startsWith(ASSET_PREFIX);
}
function assetIdFromRef(value: string) {
  return value.slice(ASSET_PREFIX.length);
}

function ImagesEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (next: string[]) => void;
}) {
  // Resolve any asset:<id> refs to signed URLs for preview.
  const assetIds = useMemo(
    () => images.filter(isAssetRef).map(assetIdFromRef),
    [images],
  );
  const resolveFn = useServerFn(resolvePublicAssets);
  const { data: resolved } = useQuery({
    queryKey: ["admin", "catalog", "product-images", assetIds],
    queryFn: () => resolveFn({ data: { ids: assetIds } }),
    enabled: assetIds.length > 0,
    staleTime: 5 * 60_000,
  });
  const urlByAsset = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of resolved?.assets ?? []) if (a?.url) map.set(a.id, a.url);
    return map;
  }, [resolved]);

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  return (
    <div className="rounded-lg border-2 border-ink bg-cream p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold uppercase tracking-widest">Images</div>
          <div className="text-xs text-muted-foreground">
            The first image is the primary. Drag order with the arrows.
          </div>
        </div>
        <MediaPicker
          value={null}
          onChange={(v) => {
            if (v?.assetId) onChange([...images, `${ASSET_PREFIX}${v.assetId}`]);
          }}
        >
          <Button type="button" variant="outline" className="border-2 border-ink">
            <ImagePlus className="mr-1 h-4 w-4" /> Add from library
          </Button>
        </MediaPicker>
      </div>

      {images.length === 0 ? (
        <div className="rounded border-2 border-dashed border-ink/20 p-6 text-center text-sm text-muted-foreground">
          No images yet. Add one from the media library.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {images.map((entry, idx) => {
            const url = isAssetRef(entry) ? urlByAsset.get(assetIdFromRef(entry)) ?? "" : entry;
            const isPrimary = idx === 0;
            return (
              <div key={`${entry}-${idx}`} className="flex items-center gap-3 rounded border-2 border-ink/10 bg-white p-2">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border">
                  {url ? (
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">…</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs">{entry}</div>
                  {isPrimary && (
                    <div className="mt-1 inline-block rounded bg-magenta px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cream">
                      Primary
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" aria-label="Move up" onClick={() => move(idx, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label="Move down" onClick={() => move(idx, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" aria-label="Remove image" onClick={() => onChange(images.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}