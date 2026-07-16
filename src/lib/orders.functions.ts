import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

const placeOrderSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  project: z.object({
    phone: z.string().min(1),
    contactMethod: z.string().min(1),
    delivery: z.string().min(1),
    completionDate: z.string().optional(),
    notes: z.string().optional(),
    projectName: z.string().optional(),
    businessName: z.string().optional(),
    generalNotes: z.string().optional(),
    reference: z.string().optional(),
    itemDetails: z
      .array(
        z.object({
          variantId: z.string(),
          notes: z.string().optional(),
          artwork: z.object({ name: z.string(), size: z.number(), type: z.string() }).optional(),
          reference: z.object({ name: z.string(), size: z.number(), type: z.string() }).optional(),
        }),
      )
      .optional(),
  }),
  items: z.array(itemSchema).min(1),
});

function serviceClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Authenticated checkout — creates an order for the signed-in user. */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof placeOrderSchema>) => placeOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const admin = serviceClient();
    // Fetch variants server-side for authoritative price
    const variantIds = data.items.map((i) => i.variantId);
    const { data: variants, error: vErr } = await admin
      .from("product_variants")
      .select("id, product_id, price, label, stock, products(name)")
      .in("id", variantIds);
    if (vErr) throw new Error(vErr.message);

    const itemsWithPrice = data.items.map((it) => {
      const v = variants?.find((x: any) => x.id === it.variantId);
      if (!v) throw new Error("Variant not found");
      const price = Number((v as any).price);
      return {
        variant_id: it.variantId,
        product_id: (v as any).product_id,
        product_name: (v as any).products?.name ?? "Product",
        variant_label: (v as any).label,
        unit_price: price,
        quantity: it.quantity,
        line_total: price * it.quantity,
      };
    });

    const subtotal = itemsWithPrice.reduce((s, i) => s + i.line_total, 0);
    const total = subtotal;

    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        user_id: context.userId,
        email: data.email,
        full_name: data.fullName,
        shipping_address: data.project as any,
        subtotal,
        discount: 0,
        total,
        discount_code: null,
        status: "pending",
      })
      .select("id, order_number, project_reference")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await admin
      .from("order_items")
      .insert(itemsWithPrice.map((i) => ({ ...i, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { id: order.id, orderNumber: order.order_number, reference: (order as any).project_reference as string };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, total, created_at, order_items(product_name, variant_label, quantity)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });
