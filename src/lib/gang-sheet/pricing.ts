// Central Gang Sheet pricing service.
// Single source of truth for public estimate, admin preview, server-side
// re-validation on submit, and stored snapshot. Do NOT calculate totals in
// any other file.

export type FillAdjustmentType =
  | "none"
  | "flat_fee"
  | "flat_discount"
  | "percentage_discount"
  | "proportional_fee";

export interface GangSheetPricingRule {
  id: string;
  code: string;
  name: string;
  width_inches: number | null;
  height_inches: number | null;
  currency: string;
  base_price: number;
  per_design_fee: number;
  fill_adjustment_type: FillAdjustmentType;
  fill_threshold_percent: number | null;
  fill_adjustment_value: number;
  minimum_total: number;
  is_active: boolean;
  sort_order: number;
  effective_from: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PricingCalcInput {
  designCount: number;
  fillPercent: number; // 0-100
}

export interface PricingBreakdown {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  currency: string;
  basePrice: number;
  perDesignFee: number;
  designCount: number;
  designsSubtotal: number;
  fillPercent: number;
  fillAdjustmentType: FillAdjustmentType;
  fillAdjustmentAmount: number; // signed: negative = discount
  minimumAdjustment: number; // amount added to reach minimum_total
  estimatedTotal: number;
  minimumTotal: number;
}

/** Snapshot persisted with every submitted quote request. */
export interface PricingSnapshot extends PricingBreakdown {
  schemaVersion: 1;
  calculatedAt: string; // ISO timestamp
}

const ROUND = (n: number) => Math.round(n * 100) / 100;

export function calculateGangSheetPrice(
  rule: GangSheetPricingRule,
  input: PricingCalcInput,
): PricingBreakdown {
  const designCount = Math.max(0, Math.floor(input.designCount || 0));
  const fillPercent = Math.max(0, Math.min(100, Number(input.fillPercent) || 0));

  const base = Number(rule.base_price) || 0;
  const perDesign = Number(rule.per_design_fee) || 0;
  const designsSubtotal = ROUND(perDesign * designCount);

  const thresholdMet =
    rule.fill_threshold_percent == null
      ? true
      : fillPercent >= Number(rule.fill_threshold_percent);

  const value = Number(rule.fill_adjustment_value) || 0;
  let fillAdj = 0;
  if (thresholdMet) {
    switch (rule.fill_adjustment_type) {
      case "flat_fee":
        fillAdj = value;
        break;
      case "flat_discount":
        fillAdj = -value;
        break;
      case "percentage_discount":
        fillAdj = -ROUND((base + designsSubtotal) * (value / 100));
        break;
      case "proportional_fee":
        fillAdj = ROUND((fillPercent / 100) * value);
        break;
      case "none":
      default:
        fillAdj = 0;
    }
  }

  let subtotal = ROUND(base + designsSubtotal + fillAdj);
  const minTotal = Number(rule.minimum_total) || 0;
  let minimumAdjustment = 0;
  if (minTotal > 0 && subtotal < minTotal) {
    minimumAdjustment = ROUND(minTotal - subtotal);
    subtotal = minTotal;
  }
  // Never negative
  const estimated = Math.max(0, ROUND(subtotal));

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    currency: rule.currency,
    basePrice: ROUND(base),
    perDesignFee: ROUND(perDesign),
    designCount,
    designsSubtotal,
    fillPercent,
    fillAdjustmentType: rule.fill_adjustment_type,
    fillAdjustmentAmount: ROUND(fillAdj),
    minimumAdjustment,
    estimatedTotal: estimated,
    minimumTotal: ROUND(minTotal),
  };
}

export function toSnapshot(breakdown: PricingBreakdown): PricingSnapshot {
  return { ...breakdown, schemaVersion: 1, calculatedAt: new Date().toISOString() };
}

export const FILL_ADJUSTMENT_TYPES: readonly FillAdjustmentType[] = [
  "none",
  "flat_fee",
  "flat_discount",
  "percentage_discount",
  "proportional_fee",
] as const;

export function fillAdjustmentLabel(t: FillAdjustmentType): string {
  switch (t) {
    case "none": return "None";
    case "flat_fee": return "Flat fee (added)";
    case "flat_discount": return "Flat discount";
    case "percentage_discount": return "Percentage discount";
    case "proportional_fee": return "Proportional fee (scales with fill %)";
  }
}