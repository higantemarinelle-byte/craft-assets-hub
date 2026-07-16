import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, description, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { category?: string; featured?: boolean; search?: string; limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("products")
      .select("id, slug, name, description, base_price, images, tags, is_featured, category_id, categories:category_id(slug, name)")
      .eq("is_published", true);
    if (data.featured) q = q.eq("is_featured", true);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    q = q.order("is_featured", { ascending: false }).order("name");
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let filtered = rows ?? [];
    if (data.category) filtered = filtered.filter((p: any) => p.categories?.slug === data.category);
    return filtered.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      base_price: Number(p.base_price),
      images: p.images ?? [],
      tags: p.tags ?? [],
      is_featured: p.is_featured,
      category: p.categories?.name ?? null,
      category_slug: p.categories?.slug ?? null,
    }));
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select("*, categories:category_id(slug, name), product_variants(id, label, price, stock, sort_order)")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) return null;
    const variants = ((product as any).product_variants ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((v: any) => ({ id: v.id, label: v.label, price: Number(v.price), stock: v.stock }));
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      care_instructions: (product as any).care_instructions,
      base_price: Number(product.base_price),
      images: product.images ?? [],
      tags: product.tags ?? [],
      is_featured: product.is_featured,
      category: (product as any).categories?.name ?? null,
      category_slug: (product as any).categories?.slug ?? null,
      variants,
    };
  });
