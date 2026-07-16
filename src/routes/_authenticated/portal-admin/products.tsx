import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminListProducts, adminDeleteProduct } from "@/lib/admin.functions";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const fetchProducts = useServerFn(adminListProducts);
  const delProduct = useServerFn(adminDeleteProduct);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin:products"], queryFn: () => fetchProducts() });

  const onDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await delProduct({ data: { id } });
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin:products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-display text-3xl">Products</h1>
        <Link to="/portal-admin/products/new">
          <Button className="border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
            <Plus className="mr-1 h-4 w-4" /> New product
          </Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id} className="border-t border-ink/10">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded border border-ink/20 bg-gradient-to-br from-cyan via-magenta to-yellow" />
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{p.category ?? "—"}</td>
                <td className="p-3 text-right font-semibold">{money(p.base_price)}</td>
                <td className="p-3 text-right">{p.total_stock}</td>
                <td className="p-3 text-center">
                  {p.is_published ? (
                    <span className="rounded bg-cyan px-2 py-0.5 text-xs font-bold">Live</span>
                  ) : (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold">Draft</span>
                  )}
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
            {data.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
