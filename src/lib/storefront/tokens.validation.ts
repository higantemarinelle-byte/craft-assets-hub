// Validation for the design-token bundle. Used both in the Theme Builder
// (client-side) and in adminSaveThemeDraft / adminPublishTheme (server-side)
// so an attacker cannot bypass the client and inject unsafe CSS.

import { z } from "zod";
import { FONT_IDS } from "./fonts";

const UNSAFE_PATTERNS = [
  /url\s*\(/i,
  /expression\s*\(/i,
  /<script/i,
  /javascript:/i,
  /@import/i,
  /[;{}]/,
  /https?:\/\//i,
];

function safeCssValue(max = 200) {
  return z.string().min(1).max(max).refine(
    (v) => !UNSAFE_PATTERNS.some((p) => p.test(v)),
    { message: "Value contains disallowed CSS syntax" },
  );
}

const colorSchema = safeCssValue(120);

export const storefrontDesignTokensSchema = z.object({
  colors: z.object({
    background: colorSchema,
    foreground: colorSchema,
    surface: colorSchema,
    surfaceForeground: colorSchema,
    primary: colorSchema,
    primaryForeground: colorSchema,
    secondary: colorSchema,
    secondaryForeground: colorSchema,
    accent: colorSchema,
    accentForeground: colorSchema,
    highlight: colorSchema,
    highlightForeground: colorSchema,
    muted: colorSchema,
    mutedForeground: colorSchema,
    border: colorSchema,
    ring: colorSchema,
    destructive: colorSchema,
  }),
  typography: z.object({
    headingFont: z.string().refine((v) => FONT_IDS.includes(v), { message: "Unknown font" }),
    bodyFont: z.string().refine((v) => FONT_IDS.includes(v), { message: "Unknown font" }),
    baseSize: z.enum(["14px", "15px", "16px", "17px", "18px"]),
    headingWeight: z.union([z.literal(500), z.literal(600), z.literal(700), z.literal(800), z.literal(900)]),
    bodyWeight: z.union([z.literal(300), z.literal(400), z.literal(500)]),
    headingLetterSpacing: z.enum(["-0.04em", "-0.03em", "-0.02em", "-0.01em", "0", "0.02em", "0.05em"]),
  }),
  buttons: z.object({ style: z.enum(["solid", "outline", "soft"]) }),
  radius: z.object({
    base: z.enum(["0", "0.25rem", "0.5rem", "0.75rem", "1rem", "1.25rem"]),
    button: z.enum(["0", "0.25rem", "0.5rem", "0.75rem", "1rem", "9999px"]),
    card: z.enum(["0", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem"]),
  }),
  spacing: z.object({
    containerMax: z.enum(["compact", "standard", "wide", "full"]),
    containerPadding: z.enum(["tight", "standard", "generous"]),
    section: z.enum(["tight", "standard", "relaxed", "spacious"]),
  }),
});

export type ValidatedDesignTokens = z.infer<typeof storefrontDesignTokensSchema>;

/** Validate a full theme draft. Only the `tokens` slice is strict; other
 *  slices are passed through so existing homepage/navigation/footer content
 *  keeps saving until dedicated builders take over in later tasks. */
export function validateThemeDraft(draft: unknown): { ok: true; draft: any } | { ok: false; error: string } {
  const d = (draft ?? {}) as any;
  if (d?.tokens !== undefined) {
    const parsed = storefrontDesignTokensSchema.safeParse(d.tokens);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
    }
    d.tokens = parsed.data;
  }
  return { ok: true, draft: d };
}