import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { Input } from "@/components/ui/input";

const search = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["featured", "name"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shop DTF Transfers — Craft & Cling" },
      { name: "description", content: "Browse ready-to-press DTF transfers, custom gang sheets, and bulk designs." },
      { property: "og:title", content: "Shop DTF Transfers — Craft & Cling" },
      { property: "og:description", content: "Browse ready-to-press DTF transfers, custom gang sheets, and bulk designs." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(searchParams.q ?? "");
  const { data: categories = [] } = useQuery({ queryKey: ["shop:categories"], queryFn: () => listCategories() });
  const { data: all = [] } = useQuery({ queryKey: ["shop:all"], queryFn: () => listProducts({ data: {} }) });

  const filtered = useMemo(() => {
    let list = all;
    if (searchParams.category) list = list.filter((p) => p.category_slug === searchParams.category);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    switch (searchParams.sort) {
      case "name": list = [...list].sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list = [...list].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    }
    return list;
  }, [all, searchParams.category, searchParams.sort, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-display text-4xl md:text-5xl">The Shop</h1>
        <p className="mt-2 text-muted-foreground">Ready-to-press transfers, gang sheets, and bulk designs.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search designs…"
          className="max-w-xs border-2 border-ink bg-cream"
        />
        <select
          value={searchParams.sort ?? "featured"}
          onChange={(e) => navigate({ search: (s: any) => ({ ...s, sort: e.target.value as any }) })}
          className="rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm font-medium"
        >
          <option value="featured">Featured</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          to="/shop"
          search={{}}
          className={`rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${!searchParams.category ? "bg-ink text-cream" : "bg-cream hover:bg-yellow"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to="/shop"
            search={{ category: c.slug }}
            className={`rounded-full border-2 border-ink px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${searchParams.category === c.slug ? "bg-ink text-cream" : "bg-cream hover:bg-yellow"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-ink/30 p-16 text-center text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
