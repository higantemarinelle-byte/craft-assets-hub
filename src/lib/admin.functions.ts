import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function serviceClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.CRAFT_SUPABASE_ADMIN_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertStaff(ctx: any, ownerOnly = false) {
  const admin = serviceClient();
  const { data } = await admin.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (ownerOnly) {
    if (!roles.includes("owner")) throw new Error("Forbidden");
  } else {
    if (!roles.includes("owner") && !roles.includes("employee")) throw new Error("Forbidden");
  }
  return { admin, roles };
}

// ============== PRODUCTS ==============
const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  care_instructions: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  base_price: z.number().nonnegative(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  variants: z.array(z.object({
    id: z.string().uuid().optional(),
    label: z.string().min(1),
    price: z.number().nonnegative(),
    stock: z.number().int().nonnegative(),
    sort_order: z.number().int().default(0),
  })).default([]),
});

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data, error } = await admin
      .from("products")
      .select("id, slug, name, base_price, is_featured, is_published, images, category_id, sort_order, categories:category_id(name, slug), product_variants(stock)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      base_price: Number(p.base_price),
      is_featured: p.is_featured,
      is_published: p.is_published,
      image: p.images?.[0] ?? null,
      category_id: p.category_id ?? null,
      category_slug: p.categories?.slug ?? null,
      sort_order: p.sort_order ?? 0,
      category: p.categories?.name ?? null,
      total_stock: (p.product_variants ?? []).reduce((s: number, v: any) => s + (v.stock ?? 0), 0),
    }));
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { data: product, error } = await admin
      .from("products").select("*, product_variants(*)").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof productSchema>) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { variants, ...prod } = data;
    let productId = prod.id;
    if (productId) {
      const { error } = await admin.from("products").update({ ...prod }).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await admin.from("products").insert({ ...prod }).select("id").single();
      if (error) throw new Error(error.message);
      productId = inserted.id;
    }
    // Sync variants — delete missing, upsert given
    const { data: existing } = await admin.from("product_variants").select("id").eq("product_id", productId!);
    const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id));
    const toDelete = (existing ?? []).map((v: any) => v.id).filter((id: string) => !keepIds.has(id));
    if (toDelete.length) await admin.from("product_variants").delete().in("id", toDelete);
    for (const v of variants) {
      if (v.id) {
        await admin.from("product_variants").update({ label: v.label, price: v.price, stock: v.stock, sort_order: v.sort_order }).eq("id", v.id);
      } else {
        await admin.from("product_variants").insert({ product_id: productId, label: v.label, price: v.price, stock: v.stock, sort_order: v.sort_order });
      }
    }
    return { id: productId };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { error } = await admin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============== ORDERS ==============
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data, error } = await admin
      .from("orders")
      .select("id, order_number, email, full_name, total, status, created_at, order_items(quantity)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((o: any) => ({
      ...o,
      total: Number(o.total),
      item_count: (o.order_items ?? []).reduce((s: number, i: any) => s + i.quantity, 0),
    }));
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "pending" | "processing" | "printed" | "shipped" | "delivered" | "cancelled" }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { error } = await admin.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============== DASHBOARD STATS (owner-only for revenue) ==============
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin, roles } = await assertStaff(context);
    const [{ count: orderCount }, { count: productCount }, { data: recent }] = await Promise.all([
      admin.from("orders").select("id", { count: "exact", head: true }),
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("orders").select("total, status, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    const isOwner = roles.includes("owner");
    const revenue = isOwner
      ? (recent ?? []).filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0)
      : null;
    return {
      orderCount: orderCount ?? 0,
      productCount: productCount ?? 0,
      revenue,
      isOwner,
    };
  });

// ============== DISCOUNTS ==============
const discountSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  kind: z.enum(["percent", "fixed"]),
  amount: z.number().positive(),
  max_uses: z.number().int().positive().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const adminListDiscounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data, error } = await admin.from("discount_codes").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof discountSchema>) => discountSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const payload = { ...data, code: data.code.toUpperCase() };
    if (payload.id) {
      const { error } = await admin.from("discount_codes").update(payload).eq("id", payload.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.from("discount_codes").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteDiscount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    await admin.from("discount_codes").delete().eq("id", data.id);
    return { ok: true };
  });

// ============== EMPLOYEES (owner-only) ==============
export const adminListStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context, true);
    const { data: roles } = await admin.from("user_roles").select("user_id, role").in("role", ["owner", "employee"]);
    if (!roles?.length) return [];
    const userIds = [...new Set(roles.map((r: any) => r.user_id))];
    const { data: profiles } = await admin.from("profiles").select("id, email, full_name").in("id", userIds);
    return userIds.map((uid) => {
      const prof = profiles?.find((p: any) => p.id === uid);
      const userRoles = roles.filter((r: any) => r.user_id === uid).map((r: any) => r.role);
      return { user_id: uid, email: prof?.email, full_name: prof?.full_name, roles: userRoles };
    });
  });

export const adminAssignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: "owner" | "employee" }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context, true);
    const { data: prof } = await admin.from("profiles").select("id").eq("email", data.email).maybeSingle();
    if (!prof) throw new Error("No user with that email — they must sign up first.");
    const { error } = await admin.from("user_roles").insert({ user_id: prof.id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRevokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "owner" | "employee" }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context, true);
    await admin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    return { ok: true };
  });

// ============== CATEGORIES (list for product form) ==============
export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data } = await admin
      .from("categories")
      .select("id, name, slug, description, sort_order, image_url, accent")
      .order("sort_order");
    return data ?? [];
  });

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  accent: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const adminSaveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof categorySchema>) => categorySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    if (data.id) {
      const { error } = await admin.from("categories").update(data as any).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await admin.from("categories").insert(data as any).select("id").single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    // Detach products from this category (do not delete products).
    await admin.from("products").update({ category_id: null }).eq("category_id", data.id);
    const { error } = await admin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReorderCategories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    for (let i = 0; i < data.ids.length; i++) {
      await admin.from("categories").update({ sort_order: i }).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

export const adminReorderProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    for (let i = 0; i < data.ids.length; i++) {
      await admin.from("products").update({ sort_order: i } as any).eq("id", data.ids[i]);
    }
    return { ok: true };
  });

export const adminToggleProductFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; field: "is_featured" | "is_published"; value: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const patch: any = { [data.field]: data.value };
    const { error } = await admin.from("products").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============== CUSTOMERS ==============
export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    // profiles with 'customer' role (or without staff role): aggregate order data.
    const { data: profiles } = await admin.from("profiles").select("id, email, full_name, created_at").order("created_at", { ascending: false }).limit(500);
    if (!profiles?.length) return [];
    const ids = profiles.map((p: any) => p.id);
    const { data: orders } = await admin.from("orders").select("user_id, total, status, created_at").in("user_id", ids);
    return profiles.map((p: any) => {
      const own = (orders ?? []).filter((o: any) => o.user_id === p.id);
      const spent = own.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + Number(o.total), 0);
      const last = own.sort((a: any, b: any) => (a.created_at < b.created_at ? 1 : -1))[0];
      return { ...p, order_count: own.length, spent, last_order_at: last?.created_at ?? null };
    });
  });

export const adminGetCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { data: profile } = await admin.from("profiles").select("*").eq("id", data.id).maybeSingle();
    const { data: orders } = await admin.from("orders").select("id, order_number, total, status, created_at, order_items(quantity, product_name)").eq("user_id", data.id).order("created_at", { ascending: false });
    return { profile, orders: orders ?? [] };
  });

// ============== ANALYTICS (owner-only revenue chart) ==============
export const adminSalesSeries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { days?: number }) => input)
  .handler(async ({ data, context }) => {
    const { admin, roles } = await assertStaff(context);
    if (!roles.includes("owner")) throw new Error("Forbidden");
    const days = data.days ?? 30;
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data: orders } = await admin.from("orders").select("total, status, created_at").gte("created_at", since);
    const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
      buckets.set(d, { date: d, revenue: 0, orders: 0 });
    }
    for (const o of orders ?? []) {
      if (o.status === "cancelled") continue;
      const d = String(o.created_at).slice(0, 10);
      const b = buckets.get(d);
      if (b) { b.revenue += Number(o.total); b.orders += 1; }
    }
    return Array.from(buckets.values());
  });

// ============== TOP PRODUCTS (revenue owner-only) ==============
export const adminTopProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data } = await admin.from("order_items").select("product_name, quantity, unit_price").limit(2000);
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const r of data ?? []) {
      const cur = map.get(r.product_name) ?? { name: r.product_name, units: 0, revenue: 0 };
      cur.units += r.quantity;
      cur.revenue += Number(r.unit_price) * r.quantity;
      map.set(r.product_name, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.units - a.units).slice(0, 8);
  });

// ============== LOW STOCK ==============
export const adminLowStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { threshold?: number }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const t = data.threshold ?? 10;
    const { data: variants } = await admin
      .from("product_variants")
      .select("id, label, stock, products:product_id(id, name, slug)")
      .lte("stock", t)
      .order("stock", { ascending: true })
      .limit(50);
    return (variants ?? []).map((v: any) => ({
      id: v.id, label: v.label, stock: v.stock,
      product_id: v.products?.id, product_name: v.products?.name, product_slug: v.products?.slug,
    }));
  });

// ============== SINGLE ORDER (for packing slip) ==============
export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { data: order } = await admin.from("orders").select("*, order_items(*)").eq("id", data.id).maybeSingle();
    return order;
  });
