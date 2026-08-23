import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetProduct } from "@/lib/admin.functions";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchOne = useServerFn(adminGetProduct);
  const query = useQuery({
    queryKey: ["admin", "catalog", "product", id],
    queryFn: () => fetchOne({ data: { id } }),
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 p-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Couldn’t load this product</h1>
        <p className="text-sm text-muted-foreground">
          {(query.error as Error)?.message ?? "An unexpected error occurred."}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => query.refetch()}>Retry</Button>
          <Link to="/portal-admin/products"><Button variant="outline">Back to products</Button></Link>
        </div>
      </div>
    );
  }
  if (!query.data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-sm text-muted-foreground">It may have been deleted.</p>
        <Link to="/portal-admin/products"><Button variant="outline">Back to products</Button></Link>
      </div>
    );
  }

  return (
    <ProductForm
      initial={query.data as any}
      onSaved={(_id, mode) => {
        if (mode === "continue") {
          void query.refetch();
        } else {
          navigate({ to: "/portal-admin/products" });
        }
      }}
      onCancel={() => navigate({ to: "/portal-admin/products" })}
    />
  );
}
