// Validation for the design-token bundle. Used both in the Theme Builder
// (client-side) and in adminSaveThemeDraft / adminPublishTheme (server-side)
// so an attacker cannot bypass the client and inject unsafe CSS.

import { z } from "zod";
import { FONT_IDS } from "./fonts";
import {
  FOOTER_LIMITS,
  NAV_LIMITS,
  SOCIAL_PLATFORMS,
  isSafeExternalUrl,
  isSafeInternalHref,
} from "./site-config";

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
  if (d?.navigation !== undefined) {
    const parsed = navigationSchema.safeParse(d.navigation);
    if (!parsed.success) {
      return { ok: false, error: `navigation: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
    }
    d.navigation = parsed.data;
  }
  if (d?.footerV2 !== undefined) {
    const parsed = footerSchema.safeParse(d.footerV2);
    if (!parsed.success) {
      return { ok: false, error: `footer: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}` };
    }
    d.footerV2 = parsed.data;
  }
  return { ok: true, draft: d };
}

// ---------- 004E schemas ----------

const linkHrefSchema = z
  .object({ type: z.enum(["internal", "external"]), href: z.string().min(1).max(NAV_LIMITS.maxHrefLen) })
  .refine(
    (v) => (v.type === "internal" ? isSafeInternalHref(v.href) : isSafeExternalUrl(v.href)),
    { message: "Unsafe or malformed URL", path: ["href"] },
  );

const navChildSchema = z
  .object({
    id: z.string().min(1).max(60),
    label: z.string().trim().min(1).max(NAV_LIMITS.maxLabelLen),
    type: z.enum(["internal", "external"]),
    href: z.string().min(1).max(NAV_LIMITS.maxHrefLen),
    enabled: z.boolean(),
    openInNewTab: z.boolean(),
    children: z.array(z.any()).max(0).optional().default([]),
  })
  .superRefine((v, ctx) => {
    const r = linkHrefSchema.safeParse({ type: v.type, href: v.href });
    if (!r.success) ctx.addIssue({ code: "custom", message: "Unsafe or malformed URL", path: ["href"] });
  });

const navLinkSchema = z
  .object({
    id: z.string().min(1).max(60),
    label: z.string().trim().min(1).max(NAV_LIMITS.maxLabelLen),
    type: z.enum(["internal", "external"]),
    href: z.string().min(1).max(NAV_LIMITS.maxHrefLen),
    enabled: z.boolean(),
    openInNewTab: z.boolean(),
    children: z.array(navChildSchema).max(NAV_LIMITS.maxChildren).default([]),
  })
  .superRefine((v, ctx) => {
    const r = linkHrefSchema.safeParse({ type: v.type, href: v.href });
    if (!r.success) ctx.addIssue({ code: "custom", message: "Unsafe or malformed URL", path: ["href"] });
  });

export const navigationSchema = z.object({
  links: z.array(navLinkSchema).max(NAV_LIMITS.maxTopLevel),
  showSearch: z.boolean(),
  showAccount: z.boolean(),
  showProjectCart: z.boolean(),
  projectCartLabel: z.string().trim().min(1).max(NAV_LIMITS.maxCartLabelLen),
  stickyHeader: z.boolean(),
});

const footerLinkSchema = z
  .object({
    id: z.string().min(1).max(60),
    label: z.string().trim().min(1).max(FOOTER_LIMITS.maxLabelLen),
    type: z.enum(["internal", "external"]),
    href: z.string().min(1).max(FOOTER_LIMITS.maxHrefLen),
    enabled: z.boolean(),
    openInNewTab: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const r = linkHrefSchema.safeParse({ type: v.type, href: v.href });
    if (!r.success) ctx.addIssue({ code: "custom", message: "Unsafe or malformed URL", path: ["href"] });
  });

const footerColumnSchema = z.object({
  id: z.string().min(1).max(60),
  heading: z.string().trim().min(1).max(FOOTER_LIMITS.maxHeadingLen),
  enabled: z.boolean(),
  links: z.array(footerLinkSchema).max(FOOTER_LIMITS.maxLinksPerColumn),
});

const socialLinkSchema = z
  .object({
    id: z.string().min(1).max(60),
    platform: z.enum(SOCIAL_PLATFORMS as any as [string, ...string[]]),
    label: z.string().trim().min(1).max(40),
    url: z.string().max(FOOTER_LIMITS.maxHrefLen),
    enabled: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!isSafeExternalUrl(v.url)) ctx.addIssue({ code: "custom", message: "Unsafe or malformed URL", path: ["url"] });
  });

export const footerSchema = z.object({
  enabled: z.boolean(),
  logoAssetId: z.string().nullable(),
  logoUrl: z.string().max(FOOTER_LIMITS.maxHrefLen).nullable(),
  businessName: z.string().trim().min(1).max(FOOTER_LIMITS.maxBusinessNameLen),
  description: z.string().max(FOOTER_LIMITS.maxDescriptionLen),
  columns: z.array(footerColumnSchema).max(FOOTER_LIMITS.maxColumns),
  contact: z.object({
    enabled: z.boolean(),
    email: z.string().max(FOOTER_LIMITS.maxContactLen),
    phone: z.string().max(FOOTER_LIMITS.maxContactLen),
    address: z.string().max(FOOTER_LIMITS.maxContactLen),
  }),
  socialLinks: z.array(socialLinkSchema).max(FOOTER_LIMITS.maxSocials),
  copyrightText: z.string().max(FOOTER_LIMITS.maxCopyrightLen),
  showPoweredBy: z.boolean(),
});