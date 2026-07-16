import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import type { GangSheetPricingRule } from "./pricing";
import { FILL_ADJUSTMENT_TYPES } from "./pricing";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
function serviceClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.CRAFT_SUPABASE_ADMIN_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertStaff(ctx: any) {
  const admin = serviceClient();
  const { data } = await admin.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("owner") && !roles.includes("employee")) throw new Error("Forbidden");
  return { admin };
}

const SELECT_COLUMNS =
  "id, code, name, width_inches, height_inches, currency, base_price, per_design_fee, fill_adjustment_type, fill_threshold_percent, fill_adjustment_value, minimum_total, is_active, sort_order, effective_from, created_at, updated_at";

function normalizeRow(r: any): GangSheetPricingRule {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    width_inches: r.width_inches == null ? null : Number(r.width_inches),
    height_inches: r.height_inches == null ? null : Number(r.height_inches),
    currency: r.currency,
    base_price: Number(r.base_price),
    per_design_fee: Number(r.per_design_fee),
    fill_adjustment_type: r.fill_adjustment_type,
    fill_threshold_percent: r.fill_threshold_percent == null ? null : Number(r.fill_threshold_percent),
    fill_adjustment_value: Number(r.fill_adjustment_value),
    minimum_total: Number(r.minimum_total),
    is_active: !!r.is_active,
    sort_order: Number(r.sort_order ?? 0),
    effective_from: r.effective_from ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Public: active pricing rules for the storefront estimator. */
export const listActivePricingRules = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await (sb.from("gang_sheet_pricing_rules") as any)
    .select(SELECT_COLUMNS)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
});

/** Staff: all pricing rules. */
export const adminListPricingRules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data, error } = await (admin.from("gang_sheet_pricing_rules") as any)
      .select(SELECT_COLUMNS)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []).map(normalizeRow);
  });

const ruleSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/i, "letters, digits, and hyphens only"),
  name: z.string().min(1).max(80),
  width_inches: z.number().positive().max(1000).nullable(),
  height_inches: z.number().positive().max(1000).nullable(),
  currency: z.string().min(3).max(6),
  base_price: z.number().nonnegative(),
  per_design_fee: z.number().nonnegative(),
  fill_adjustment_type: z.enum(FILL_ADJUSTMENT_TYPES as unknown as [string, ...string[]]),
  fill_threshold_percent: z.number().min(0).max(100).nullable(),
  fill_adjustment_value: z.number().nonnegative(),
  minimum_total: z.number().nonnegative(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
});

export const adminSavePricingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => ruleSchema.parse(raw))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const row: any = { ...data, updated_by: context.userId };
    if (data.id) {
      const { error } = await (admin.from("gang_sheet_pricing_rules") as any)
        .update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    row.created_by = context.userId;
    const { data: inserted, error } = await (admin.from("gang_sheet_pricing_rules") as any)
      .insert(row).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: (inserted as any).id as string };
  });

export const adminDeletePricingRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { error } = await (admin.from("gang_sheet_pricing_rules") as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });