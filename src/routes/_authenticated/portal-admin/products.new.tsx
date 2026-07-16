import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/portal-admin/products/new")({
  head: () => ({ meta: [{ title: "New product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  return (
    <ProductForm
      initial={null}
      onSaved={() => navigate({ to: "/portal-admin/products" })}
    />
  );
}
