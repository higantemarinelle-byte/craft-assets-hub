// Typed design-token architecture used by the Craft Studio Theme Builder
// (004D). Tokens are the source of truth for storefront visual design and
// project into CSS custom properties scoped to `.storefront-theme` so they
// never bleed into Craft OS admin pages.

import { DEFAULT_FONT_STACKS } from "./fonts";

export type StorefrontColorTokens = {
  background: string;
  foreground: string;

  surface: string;
  surfaceForeground: string;

  primary: string;
  primaryForeground: string;

  secondary: string;
  secondaryForeground: string;

  accent: string;
  accentForeground: string;

  highlight: string;
  highlightForeground: string;

  muted: string;
  mutedForeground: string;

  border: string;
  ring: string;
  destructive: string;
};

export type StorefrontTypographyTokens = {
  /** Font registry ID (see `./fonts`). */
  headingFont: string;
  bodyFont: string;
  baseSize: "14px" | "15px" | "16px" | "17px" | "18px";
  headingWeight: 500 | 600 | 700 | 800 | 900;
  bodyWeight: 300 | 400 | 500;
  headingLetterSpacing: "-0.04em" | "-0.03em" | "-0.02em" | "-0.01em" | "0" | "0.02em" | "0.05em";
};

export type StorefrontButtonTokens = { style: "solid" | "outline" | "soft" };

export type StorefrontRadiusTokens = {
  base: "0" | "0.25rem" | "0.5rem" | "0.75rem" | "1rem" | "1.25rem";
  button: "0" | "0.25rem" | "0.5rem" | "0.75rem" | "1rem" | "9999px";
  card: "0" | "0.5rem" | "0.75rem" | "1rem" | "1.5rem" | "2rem";
};

export type StorefrontSpacingTokens = {
  /** Named preset. Mapped to a CSS value in `designTokensToCssVariables`. */
  containerMax: "compact" | "standard" | "wide" | "full";
  containerPadding: "tight" | "standard" | "generous";
  section: "tight" | "standard" | "relaxed" | "spacious";
};

export type StorefrontDesignTokens = {
  colors: StorefrontColorTokens;
  typography: StorefrontTypographyTokens;
  buttons: StorefrontButtonTokens;
  radius: StorefrontRadiusTokens;
  spacing: StorefrontSpacingTokens;
};

// Preserve current Craft & Cling appearance exactly.
export const DEFAULT_DESIGN_TOKENS: StorefrontDesignTokens = {
  colors: {
    background: "oklch(0.97 0.02 90)",     // cream
    foreground: "oklch(0.15 0.02 260)",    // ink
    surface: "oklch(1 0 0)",
    surfaceForeground: "oklch(0.15 0.02 260)",
    primary: "oklch(0.15 0.02 260)",       // ink
    primaryForeground: "oklch(0.98 0.01 90)",
    // Neutral surface — matches the original storefront palette so
    // shadcn `secondary` buttons/badges stay quiet. The bold CMYK cyan is
    // still available as `--cmyk-cyan` / `bg-cyan` for poster accents.
    secondary: "oklch(0.93 0.02 90)",
    secondaryForeground: "oklch(0.15 0.02 260)",
    accent: "oklch(0.63 0.28 0)",          // magenta
    accentForeground: "oklch(0.98 0.01 90)",
    highlight: "oklch(0.9 0.19 100)",      // yellow
    highlightForeground: "oklch(0.15 0.02 260)",
    muted: "oklch(0.94 0.015 90)",
    mutedForeground: "oklch(0.45 0.02 260)",
    border: "oklch(0.15 0.02 260 / 12%)",
    ring: "oklch(0.63 0.28 0)",
    destructive: "oklch(0.577 0.245 27.325)",
  },
  typography: {
    headingFont: "space-grotesk",
    bodyFont: "dm-sans",
    baseSize: "16px",
    headingWeight: 700,
    bodyWeight: 400,
    headingLetterSpacing: "-0.02em",
  },
  buttons: { style: "solid" },
  radius: { base: "0.5rem", button: "0.5rem", card: "0.75rem" },
  spacing: { containerMax: "standard", containerPadding: "standard", section: "standard" },
};

// ---------- Presets --------------------------------------------------------

export type StorefrontThemePreset = {
  id: string;
  name: string;
  description: string;
  tokens: StorefrontDesignTokens;
};

export const STOREFRONT_THEME_PRESETS: StorefrontThemePreset[] = [
  {
    id: "craft-cling-default",
    name: "Craft & Cling Default",
    description: "Cream paper, inky charcoal, CMYK poster accents.",
    tokens: DEFAULT_DESIGN_TOKENS,
  },
  {
    id: "bold-cmyk",
    name: "Bold CMYK",
    description: "Louder magenta and cyan on a paper base.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        primary: "oklch(0.63 0.28 0)",       // magenta primary
        primaryForeground: "oklch(0.98 0.01 90)",
        secondary: "oklch(0.72 0.18 220)",
        accent: "oklch(0.15 0.02 260)",
        highlight: "oklch(0.9 0.19 100)",
      },
      buttons: { style: "solid" },
      radius: { base: "0.25rem", button: "0.25rem", card: "0.5rem" },
    },
  },
  {
    id: "soft-craft",
    name: "Soft Craft",
    description: "Warm neutrals, softer contrast, generous spacing.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        background: "oklch(0.98 0.015 80)",
        foreground: "oklch(0.25 0.02 260)",
        primary: "oklch(0.35 0.05 30)",
        primaryForeground: "oklch(0.98 0.01 90)",
        secondary: "oklch(0.82 0.06 200)",
        accent: "oklch(0.7 0.15 30)",
        highlight: "oklch(0.88 0.12 90)",
        border: "oklch(0.25 0.02 260 / 15%)",
      },
      typography: { ...DEFAULT_DESIGN_TOKENS.typography, headingFont: "playfair-display", bodyFont: "lora" },
      buttons: { style: "soft" },
      radius: { base: "0.75rem", button: "1rem", card: "1.5rem" },
      spacing: { containerMax: "standard", containerPadding: "generous", section: "relaxed" },
    },
  },
  {
    id: "minimal-ink",
    name: "Minimal Ink",
    description: "Reduced palette, tighter type, black-and-white first.",
    tokens: {
      ...DEFAULT_DESIGN_TOKENS,
      colors: {
        ...DEFAULT_DESIGN_TOKENS.colors,
        background: "oklch(1 0 0)",
        foreground: "oklch(0.1 0 0)",
        surface: "oklch(0.98 0 0)",
        primary: "oklch(0.1 0 0)",
        secondary: "oklch(0.45 0 0)",
        accent: "oklch(0.55 0.22 25)",
        highlight: "oklch(0.95 0.04 90)",
        muted: "oklch(0.96 0 0)",
        mutedForeground: "oklch(0.4 0 0)",
        border: "oklch(0.1 0 0 / 12%)",
      },
      typography: { ...DEFAULT_DESIGN_TOKENS.typography, headingFont: "inter", bodyFont: "inter", headingLetterSpacing: "-0.03em" },
      buttons: { style: "outline" },
      radius: { base: "0.25rem", button: "0.25rem", card: "0.5rem" },
      spacing: { containerMax: "wide", containerPadding: "standard", section: "standard" },
    },
  },
];

// ---------- Merge ----------------------------------------------------------

export function mergeDesignTokens(partial: unknown): StorefrontDesignTokens {
  const p = (partial ?? {}) as Partial<StorefrontDesignTokens>;
  return {
    colors: { ...DEFAULT_DESIGN_TOKENS.colors, ...(p.colors ?? {}) },
    typography: { ...DEFAULT_DESIGN_TOKENS.typography, ...(p.typography ?? {}) },
    buttons: { ...DEFAULT_DESIGN_TOKENS.buttons, ...(p.buttons ?? {}) },
    radius: { ...DEFAULT_DESIGN_TOKENS.radius, ...(p.radius ?? {}) },
    spacing: { ...DEFAULT_DESIGN_TOKENS.spacing, ...(p.spacing ?? {}) },
  };
}

// ---------- Preset resolution for named tokens -----------------------------

const CONTAINER_MAX: Record<StorefrontSpacingTokens["containerMax"], string> = {
  compact: "960px",
  standard: "1200px",
  wide: "1440px",
  full: "100%",
};
const CONTAINER_PADDING: Record<StorefrontSpacingTokens["containerPadding"], string> = {
  tight: "0.75rem",
  standard: "1rem",
  generous: "1.5rem",
};
const SECTION_SPACING: Record<StorefrontSpacingTokens["section"], string> = {
  tight: "2.5rem",
  standard: "4rem",
  relaxed: "5.5rem",
  spacious: "7rem",
};

/** Project the token bundle to CSS custom properties. Includes legacy
 *  Craft & Cling variables (`--ink`, `--cream`, `--cmyk-*`) so existing
 *  storefront classes (`bg-ink`, `text-cream`, ...) respond to the theme. */
export function designTokensToCssVariables(tokens: StorefrontDesignTokens): Record<string, string> {
  const c = tokens.colors;
  const t = tokens.typography;
  const r = tokens.radius;
  const s = tokens.spacing;
  const headingStack = DEFAULT_FONT_STACKS[t.headingFont] ?? DEFAULT_FONT_STACKS["space-grotesk"];
  const bodyStack = DEFAULT_FONT_STACKS[t.bodyFont] ?? DEFAULT_FONT_STACKS["dm-sans"];

  return {
    // shadcn / storefront semantic
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.surface,
    "--card-foreground": c.surfaceForeground,
    "--popover": c.surface,
    "--popover-foreground": c.surfaceForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--border": c.border,
    "--input": c.border,
    "--ring": c.ring,
    "--destructive": c.destructive,

    // typography
    "--font-display": headingStack,
    "--font-sans": bodyStack,
    "--font-base-size": t.baseSize,
    "--font-heading-weight": String(t.headingWeight),
    "--font-body-weight": String(t.bodyWeight),
    "--font-heading-letter-spacing": t.headingLetterSpacing,

    // radius
    "--radius": r.base,
    "--button-radius": r.button,
    "--card-radius": r.card,

    // spacing
    "--container-max": CONTAINER_MAX[s.containerMax],
    "--container-padding": CONTAINER_PADDING[s.containerPadding],
    "--section-spacing": SECTION_SPACING[s.section],

    // legacy Craft & Cling aliases — kept so existing utility classes work
    "--ink": c.primary,
    "--ink-foreground": c.primaryForeground,
    "--cream": c.background,
    // CMYK poster accents — kept independent of shadcn `secondary` so the
    // neutral secondary surface doesn't wash out the loud cyan utility.
    "--cmyk-cyan": "oklch(0.72 0.18 220)",
    "--cmyk-magenta": c.accent,
    "--cmyk-yellow": c.highlight,
  };
}

export function designTokensToCssBlock(tokens: StorefrontDesignTokens, selector = ".storefront-theme"): string {
  const vars = designTokensToCssVariables(tokens);
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}

// ---------- Backward-compat aliases (old exports) --------------------------

export type DesignTokens = StorefrontDesignTokens;
export const DEFAULT_TOKENS = DEFAULT_DESIGN_TOKENS;
export const tokensToCssVariables = designTokensToCssVariables;
export const tokensToCssBlock = designTokensToCssBlock;