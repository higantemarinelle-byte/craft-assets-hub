import { Link } from "@tanstack/react-router";
import { money } from "@/lib/format";

export type ProductCardData = {
  slug: string;
  name: string;
  category?: string | null;
  base_price: number | string;
  images?: string[] | null;
  is_featured?: boolean;
};

const gradientForSlug = (slug: string) => {
  const gradients = [
    "from-cyan/80 via-cyan to-cyan/60",
    "from-magenta/80 via-magenta to-magenta/60",
    "from-yellow/80 via-yellow to-yellow/60",
    "from-cyan/70 via-magenta/60 to-yellow/70",
    "from-ink via-magenta to-cyan",
    "from-yellow via-magenta to-cyan",
  ];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = product.images?.[0];
  const grad = gradientForSlug(product.slug);
  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-ink bg-cream transition group-hover:cmyk-shadow">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad} p-6`}>
            <div className="halftone absolute inset-0 opacity-20" />
            <div className="text-display relative text-center text-3xl leading-none text-ink/90">
              {product.name.split(" ").slice(0, 2).join(" ")}
            </div>
          </div>
        )}
        {product.is_featured && (
          <span className="absolute left-2 top-2 rounded-full bg-magenta px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cream">
            Best seller
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-ink">{product.name}</div>
          {product.category && (
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              {product.category}
            </div>
          )}
        </div>
        <div className="text-sm font-bold text-ink">
          {money(product.base_price as number)}
        </div>
      </div>
    </Link>
  );
}
