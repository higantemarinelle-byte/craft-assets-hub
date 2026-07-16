import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListProducts,
  adminDeleteProduct,
  adminListCategories,
  adminToggleProductFlag,
  adminReorderProducts,
} from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Star, Eye } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/portal-admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const fetchProducts = useServerFn(adminListProducts);
  const fetchCats = useServerFn(adminListCategories);
  const delProduct = useServerFn(adminDeleteProduct);
  const toggleFlag = useServerFn(adminToggleProductFlag);
  const reorder = useServerFn(adminReorderProducts);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin:products"], queryFn: () => fetchProducts() });
  const { data: categories = [] } = useQuery({ queryKey: ["admin:cats"], queryFn: () => fetchCats() });

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "featured">("all");

  const filtered = useMemo(() => {
    return data.filter((p: any) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (catFilter && p.category_id !== catFilter) return false;
      if (statusFilter === "published" && !p.is_published) return false;
      if (statusFilter === "draft" && p.is_published) return false;
      if (statusFilter === "featured" && !p.is_featured) return false;
      return true;
    });
  }, [data, q, catFilter, statusFilter]);

  const onToggle = async (id: string, field: "is_featured" | "is_published", value: boolean) => {
    await toggleFlag({ data: { id, field, value } });
    qc.invalidateQueries({ queryKey: ["admin:products"] });
  };

  const move = async (idx: number, dir: -1 | 1) => {
    // Reorder based on the full list ordering (not filtered) to keep sort_order coherent.
    const ids = data.map((p: any) => p.id);
    const realIdx = ids.indexOf(filtered[idx].id);
    const j = realIdx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[realIdx], ids[j]] = [ids[j], ids[realIdx]];
    await reorder({ data: { ids } });
    qc.invalidateQueries({ queryKey: ["admin:products"] });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await delProduct({ data: { id } });
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin:products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manages pre-made products across the shop, category pages, and Popular Designs.
          </p>
        </div>
        <Link to="/portal-admin/products/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" /> New product
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name…"
          className="max-w-xs"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="published">Live</option>
          <option value="draft">Draft</option>
          <option value="featured">Popular designs</option>
        </select>
        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} of {data.length}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-center">Live</th>
              <th className="p-3 text-center">Popular</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any, i: number) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => move(i, -1)} aria-label="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => move(i, 1)} aria-label="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded border object-cover" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded border bg-gradient-to-br from-cyan via-magenta to-yellow" />
                    )}
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-slate-500">{p.category ?? "—"}</td>
                <td className="p-3 text-right font-semibold">{money(p.base_price)}</td>
                <td className="p-3 text-right">{p.total_stock}</td>
                <td className="p-3 text-center">
                  <Switch
                    checked={p.is_published}
                    onCheckedChange={(v) => onToggle(p.id, "is_published", v)}
                    aria-label="Toggle published"
                  />
                </td>
                <td className="p-3 text-center">
                  <Switch
                    checked={p.is_featured}
                    onCheckedChange={(v) => onToggle(p.id, "is_featured", v)}
                    aria-label="Toggle featured / popular"
                  />
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Link to="/portal-admin/products/$id" params={{ id: p.id }}>
                      <Button size="icon" variant="ghost" aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                    <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => onDelete(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-10 text-center text-slate-500">No products match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        <Star className="mr-1 inline h-3 w-3" /> <b>Popular</b> shows the product in the “Popular designs” storefront section.
        <Eye className="ml-4 mr-1 inline h-3 w-3" /> <b>Live</b> makes it visible in the public shop. Use the arrows to reorder.
      </p>
    </div>
  );
}
