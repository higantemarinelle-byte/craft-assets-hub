import { createFileRoute, notFound, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ShoppingBag, Truck, Shirt } from "lucide-react";
import { getProduct, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/$slug")({
  ssr: false,
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData({
      queryKey: ["product", params.slug],
      queryFn: () => getProduct({ data: { slug: params.slug } }),
    });
    if (!product) throw notFound();
    await context.queryClient.ensureQueryData({
      queryKey: ["product:related", product.category_slug],
      queryFn: () => listProducts({ data: { category: product.category_slug ?? undefined, limit: 4 } }),
    });
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Product — Craft & Cling" }] };
    const p = loaderData.product;
    const img = p.images?.[0];
    return {
      meta: [
        { title: `${p.name} — Craft & Cling` },
        { name: "description", content: p.description?.slice(0, 155) ?? `${p.name} DTF transfer` },
        { property: "og:title", content: `${p.name} — Craft & Cling` },
        { property: "og:description", content: p.description?.slice(0, 155) ?? `${p.name} DTF transfer` },
        ...(img ? [{ property: "og:image", content: img } as any, { name: "twitter:image", content: img } as any] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl p-16 text-center">
      <h1 className="text-display text-3xl">Design not found</h1>
      <p className="mt-2 text-muted-foreground">This transfer may be sold out or renamed.</p>
      <Link to="/shop" className="mt-6 inline-block underline">Back to shop</Link>
    </div>
  ),
  component: Product,
});

function Product() {
  const { product } = Route.useLoaderData();
  const { data: related = [] } = useQuery({
    queryKey: ["product:related", product.category_slug],
    queryFn: () => listProducts({ data: { category: product.category_slug ?? undefined, limit: 4 } }),
  });
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const { add } = useCart();
  const router = useRouter();

  const variant = useMemo(() => (product.variants as Array<{id:string;label:string;price:number;stock:number}>).find((v) => v.id === variantId), [variantId, product.variants]);
  const relatedList = related.filter((p) => p.slug !== product.slug).slice(0, 4);

  const handleAdd = () => {
    if (!variant) return;
    add({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      image: product.images?.[0],
      quantity: qty,
    });
    toast.success("Added to project", { description: `${product.name} · ${variant.label} × ${qty}` });
  };

  const gradientClass = "from-cyan via-magenta to-yellow";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <button
        onClick={() => router.history.back()}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink bg-cream cmyk-shadow">
            {product.images[activeImg] ? (
              <img src={product.images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass} p-10`}>
                <div className="halftone absolute inset-0 opacity-20" />
                <div className="text-display relative text-center text-5xl leading-none text-ink">
                  {product.name}
                </div>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {(product.images as string[]).map((img: string, i: number) => (
                <button
                  key={img}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded border-2 ${i === activeImg ? "border-magenta" : "border-ink/30"}`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <div className="text-xs font-bold uppercase tracking-widest text-magenta">{product.category}</div>
          )}
          <h1 className="mt-1 text-display text-4xl md:text-5xl">{product.name}</h1>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-widest text-ink">
            Quoted per project
          </div>
          {product.description && (
            <p className="mt-4 text-ink/75">{product.description}</p>
          )}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest">Size</div>
              <div className="flex flex-wrap gap-2">
                {(product.variants as Array<{id:string;label:string;price:number;stock:number}>).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    disabled={v.stock <= 0}
                    className={`rounded-md border-2 border-ink px-4 py-2 text-sm font-semibold transition ${v.id === variantId ? "bg-ink text-cream" : "bg-cream hover:bg-yellow"} disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-md border-2 border-ink">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-lg font-bold">−</button>
              <div className="w-10 text-center font-bold">{qty}</div>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-lg font-bold">+</button>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!variant}
              className="flex-1 border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta"
              size="lg"
            >
              <ShoppingBag className="mr-2 h-4 w-4" /> Add to Project
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 rounded-md border-2 border-ink/10 bg-cream p-3">
              <Truck className="mt-0.5 h-4 w-4 text-magenta" />
              <div>
                <div className="font-semibold">Ships finished</div>
                <div className="text-xs text-muted-foreground">Delivered ready to wear</div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-md border-2 border-ink/10 bg-cream p-3">
              <Shirt className="mt-0.5 h-4 w-4 text-magenta" />
              <div>
                <div className="font-semibold">We press it for you</div>
                <div className="text-xs text-muted-foreground">Pro heat press · CMYK+W</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="care" className="mt-8">
            <TabsList className="border-2 border-ink bg-cream">
              <TabsTrigger value="care">Care & application</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            <TabsContent value="care" className="mt-4 text-sm text-ink/80">
              {product.care_instructions ?? "Wash inside-out cold. Tumble dry low. Do not iron directly on print. Press at 315°F / 160°C for 15 seconds with medium pressure, warm peel."}
            </TabsContent>
            <TabsContent value="details" className="mt-4 text-sm text-ink/80">
              Full CMYK + white ink on 75 micron PET film. Cures at 320°F. Adheres to cotton, poly, blends, canvas, denim.
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {relatedList.length > 0 && (
        <section className="mt-20">
          <h2 className="text-display text-2xl md:text-3xl">You might also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            {relatedList.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
