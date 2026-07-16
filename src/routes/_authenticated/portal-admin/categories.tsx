import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  adminListCategories,
  adminSaveCategory,
  adminDeleteCategory,
  adminReorderCategories,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  accent: string | null;
  sort_order: number;
};

function CategoriesPage() {
  const fetchCats = useServerFn(adminListCategories);
  const save = useServerFn(adminSaveCategory);
  const del = useServerFn(adminDeleteCategory);
  const reorder = useServerFn(adminReorderCategories);
  const qc = useQueryClient();

  const { data = [] } = useQuery({ queryKey: ["admin:categories"], queryFn: () => fetchCats() });
  const cats = data as Category[];
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const move = async (idx: number, dir: -1 | 1) => {
    const ids = cats.map((c) => c.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await reorder({ data: { ids } });
    qc.invalidateQueries({ queryKey: ["admin:categories"] });
  };

  const onDelete = async (c: Category) => {
    if (!confirm(`Delete "${c.name}"? Products in this category will be uncategorised.`)) return;
    await del({ data: { id: c.id } });
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin:categories"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manages the “Explore by category” tiles on the storefront and the shop filters.
          </p>
        </div>
        <Button onClick={() => setEditing({ name: "", slug: "", description: "" })}>
          <Plus className="mr-1 h-4 w-4" /> New category
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Slug</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {cats.map((c, i) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === cats.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 text-slate-500">/{c.slug}</td>
                <td className="p-3 text-slate-500">{c.description ?? "—"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onDelete(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {cats.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-slate-500">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <CategoryDrawer
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (v) => {
            try {
              await save({ data: v as any });
              toast.success("Saved");
              setEditing(null);
              qc.invalidateQueries({ queryKey: ["admin:categories"] });
              qc.invalidateQueries({ queryKey: ["admin:cats"] });
            } catch (e: any) {
              toast.error("Could not save", { description: e?.message });
            }
          }}
        />
      )}
    </div>
  );
}

function CategoryDrawer({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Category>;
  onClose: () => void;
  onSave: (v: Partial<Category>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    id: initial.id,
    name: initial.name ?? "",
    slug: initial.slug ?? "",
    description: initial.description ?? "",
    image_url: initial.image_url ?? "",
    accent: initial.accent ?? "",
    sort_order: initial.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const autoSlug = () =>
    setForm((f) => ({
      ...f,
      slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 sm:items-center sm:justify-center">
      <div className="w-full max-w-lg rounded-t-lg bg-white p-6 shadow-xl sm:rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{form.id ? "Edit category" : "New category"}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={autoSlug} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <p className="mt-1 text-xs text-slate-500">Lowercase letters, numbers, dashes. Used in shop URLs.</p>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label>Image URL (optional)</Label>
            <Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label>Accent color (optional)</Label>
            <Input value={form.accent ?? ""} onChange={(e) => setForm({ ...form, accent: e.target.value })} placeholder="#00AEEF" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || !form.name || !form.slug}
            onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}