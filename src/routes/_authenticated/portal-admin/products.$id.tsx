import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
    queryFn: async () => {
      try {
        // 15s hard timeout so we never sit on a silent hang.
        const result = await Promise.race([
          fetchOne({ data: { id } }),
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("Request timed out after 15s")), 15_000),
          ),
        ]);
        return result;
      } catch (err) {
        // Always leave breadcrumbs in the console so silent failures are debuggable.
        console.error("[adminGetProduct] failed for id", id, err);
        throw err;
      }
    },
    retry: 0,
  });

  // If the initial load takes longer than 8s, surface a soft hint instead of
  // an infinite spinner (in addition to the 15s hard timeout above).
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!query.isLoading) return;
    const t = setTimeout(() => setSlow(true), 8_000);
    return () => clearTimeout(t);
  }, [query.isLoading]);

  if (query.isLoading) {
    return (
      <div className="space-y-3 p-8 text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
        </div>
        {slow && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            This is taking longer than usual. If it doesn’t load in a few
            seconds, try refreshing — you may have been signed out.
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => query.refetch()}>Retry</Button>
              <Link to="/auth"><Button size="sm" variant="outline">Sign in again</Button></Link>
            </div>
          </div>
        )}
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
