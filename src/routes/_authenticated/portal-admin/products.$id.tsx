import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminGetProduct } from "@/lib/admin.functions";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/portal-admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchOne = useServerFn(adminGetProduct);
  const { data, isLoading } = useQuery({
    queryKey: ["admin:product", id],
    queryFn: () => fetchOne({ data: { id } }),
  });

  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Not found</div>;

  return (
    <ProductForm
      initial={data as any}
      onSaved={() => navigate({ to: "/portal-admin/products" })}
    />
  );
}
