// Quote Requests — server functions for submit + admin management.
// Public submit is unauthenticated (customer intake). Admin functions
// re-verify staff role. Storage uploads go through service_role.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import {
  calculateGangSheetPrice,
  toSnapshot,
  type GangSheetPricingRule,
} from "@/lib/gang-sheet/pricing";

function serviceClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.CRAFT_SUPABASE_ADMIN_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertStaff(ctx: any) {
  const admin = serviceClient();
  const { data } = await admin.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("owner") && !roles.includes("employee")) throw new Error("Forbidden");
  return { admin };
}

const BUCKET = "quote-artwork";
const MAX_DESIGNS = 40;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // 15 MB total payload guard

const designSchema = z.object({
  name: z.string().min(1).max(200),
  dataUrl: z.string().min(20).max(6_000_000),
  width_in: z.number().nonnegative().max(1000),
  height_in: z.number().nonnegative().max(1000),
  x_in: z.number().min(0).max(1000).default(0),
  y_in: z.number().min(0).max(1000).default(0),
});

const submitSchema = z.object({
  sheet_code: z.string().min(1).max(64),
  fill_percent: z.number().min(0).max(100),
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(200),
  customer_phone: z.string().trim().max(60).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  designs: z.array(designSchema).min(1).max(MAX_DESIGNS),
});

function safeSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string; ext: string } {
  const m = /^data:([^;,]+)?(?:;base64)?,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error("Invalid image data");
  const contentType = m[1] || "application/octet-stream";
  const b64 = m[2];
  const bin = typeof atob === "function"
    ? atob(b64)
    : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext =
    contentType.includes("png") ? "png" :
    contentType.includes("jpeg") ? "jpg" :
    contentType.includes("jpg") ? "jpg" :
    contentType.includes("webp") ? "webp" :
    contentType.includes("svg") ? "svg" : "bin";
  return { bytes, contentType, ext };
}

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => submitSchema.parse(raw))
  .handler(async ({ data }) => {
    // Payload size guard (base64 chars ~= bytes * 4/3)
    const approxBytes = data.designs.reduce((s, d) => s + d.dataUrl.length, 0) * 0.75;
    if (approxBytes > MAX_TOTAL_BYTES) throw new Error("Artwork payload too large (max 15 MB total).");

    const admin = serviceClient();

    // Resolve pricing rule server-side (never trust client totals)
    const { data: ruleRow, error: ruleErr } = await (admin.from("gang_sheet_pricing_rules") as any)
      .select("id, code, name, width_inches, height_inches, currency, base_price, per_design_fee, fill_adjustment_type, fill_threshold_percent, fill_adjustment_value, minimum_total, is_active, sort_order, effective_from")
      .eq("code", data.sheet_code)
      .eq("is_active", true)
      .maybeSingle();
    if (ruleErr) throw new Error(ruleErr.message);
    if (!ruleRow) throw new Error("That sheet size is not available.");

    const rule: GangSheetPricingRule = {
      ...(ruleRow as any),
      width_inches: (ruleRow as any).width_inches == null ? null : Number((ruleRow as any).width_inches),
      height_inches: (ruleRow as any).height_inches == null ? null : Number((ruleRow as any).height_inches),
      base_price: Number((ruleRow as any).base_price),
      per_design_fee: Number((ruleRow as any).per_design_fee),
      fill_threshold_percent:
        (ruleRow as any).fill_threshold_percent == null ? null : Number((ruleRow as any).fill_threshold_percent),
      fill_adjustment_value: Number((ruleRow as any).fill_adjustment_value),
      minimum_total: Number((ruleRow as any).minimum_total),
    };

    const breakdown = calculateGangSheetPrice(rule, {
      designCount: data.designs.length,
      fillPercent: data.fill_percent,
    });
    const snapshot = toSnapshot(breakdown);

    // Insert row first (trigger assigns reference)
    const { data: inserted, error: insErr } = await (admin.from("quote_requests") as any)
      .insert({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        notes: data.notes || null,
        sheet_code: rule.code,
        sheet_name: rule.name,
        sheet_width_inches: rule.width_inches,
        sheet_height_inches: rule.height_inches,
        design_count: data.designs.length,
        fill_percent: data.fill_percent,
        currency: rule.currency,
        estimated_total: breakdown.estimatedTotal,
        pricing_snapshot: snapshot,
        designs: [],
        status: "submitted",
      })
      .select("id, reference")
      .single();
    if (insErr || !inserted) throw new Error(insErr?.message ?? "Failed to save quote request");

    const id = (inserted as any).id as string;
    const reference = (inserted as any).reference as string;

    // Upload each design under {reference}/{index}-{slug}.{ext}
    const designRecords: any[] = [];
    for (let i = 0; i < data.designs.length; i++) {
      const d = data.designs[i];
      try {
        const { bytes, contentType, ext } = decodeDataUrl(d.dataUrl);
        const objectPath = `${reference}/${String(i + 1).padStart(2, "0")}-${safeSlug(d.name)}.${ext}`;
        const up = await admin.storage.from(BUCKET).upload(objectPath, bytes, {
          contentType,
          upsert: true,
        });
        if (up.error) throw new Error(up.error.message);
        designRecords.push({
          name: d.name,
          storage_path: objectPath,
          content_type: contentType,
          width_in: d.width_in,
          height_in: d.height_in,
          x_in: d.x_in,
          y_in: d.y_in,
        });
      } catch (e: any) {
        designRecords.push({
          name: d.name,
          storage_path: null,
          error: e?.message ?? "upload failed",
          width_in: d.width_in,
          height_in: d.height_in,
          x_in: d.x_in,
          y_in: d.y_in,
        });
      }
    }

    await (admin.from("quote_requests") as any).update({ designs: designRecords }).eq("id", id);

    return { ok: true, id, reference };
  });

// ---------- Admin ----------

export const adminListQuoteRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await assertStaff(context);
    const { data, error } = await (admin.from("quote_requests") as any)
      .select(
        "id, reference, customer_name, customer_email, sheet_name, design_count, fill_percent, currency, estimated_total, quoted_total, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminGetQuoteRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const { data: row, error } = await (admin.from("quote_requests") as any)
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");

    // Sign design URLs (60 min)
    const designs = Array.isArray((row as any).designs) ? (row as any).designs : [];
    const signed: any[] = [];
    for (const d of designs) {
      if (d?.storage_path) {
        const { data: s } = await admin.storage.from(BUCKET).createSignedUrl(d.storage_path, 60 * 60);
        signed.push({ ...d, signed_url: s?.signedUrl ?? null });
      } else {
        signed.push({ ...d, signed_url: null });
      }
    }
    return { ...(row as any), designs: signed };
  });

const statusEnum = z.enum(["submitted", "reviewing", "quoted", "approved", "declined", "converted"]);

export const adminUpdateQuoteRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: statusEnum.optional(),
        quoted_total: z.number().nonnegative().nullable().optional(),
        quote_notes: z.string().max(4000).nullable().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context);
    const patch: any = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.quoted_total !== undefined) patch.quoted_total = data.quoted_total;
    if (data.quote_notes !== undefined) patch.quote_notes = data.quote_notes;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await (admin.from("quote_requests") as any).update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });