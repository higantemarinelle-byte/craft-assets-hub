// Typed design-token architecture. The Theme Builder UI comes in 004D; this
// task lands the schema + CSS-variable projector so downstream editors and
// storefront components can consume tokens today.

export type ColorTokens = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
};

export type TypographyTokens = {
  headingFont: string;
  bodyFont: string;
  baseSize: string; // e.g. "16px"
  headingWeight: number;
  bodyWeight: number;
};

export type SpacingTokens = {
  radius: string; // e.g. "0.625rem"
  containerMax: string;
};

export type DesignTokens = {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
};

export const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.129 0.042 264.695)",
    primary: "oklch(0.208 0.042 265.755)",
    primaryForeground: "oklch(0.984 0.003 247.858)",
    accent: "oklch(0.968 0.007 247.896)",
    accentForeground: "oklch(0.208 0.042 265.755)",
    muted: "oklch(0.968 0.007 247.896)",
    mutedForeground: "oklch(0.554 0.046 257.417)",
    border: "oklch(0.929 0.013 255.508)",
    destructive: "oklch(0.577 0.245 27.325)",
  },
  typography: {
    headingFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    bodyFont: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    baseSize: "16px",
    headingWeight: 700,
    bodyWeight: 400,
  },
  spacing: {
    radius: "0.625rem",
    containerMax: "1200px",
  },
};

/** Convert a token bundle into CSS custom properties keyed to the design
 *  system defined in src/styles.css. */
export function tokensToCssVariables(tokens: DesignTokens): Record<string, string> {
  const c = tokens.colors;
  return {
    "--background": c.background,
    "--foreground": c.foreground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--border": c.border,
    "--destructive": c.destructive,
    "--radius": tokens.spacing.radius,
    "--container-max": tokens.spacing.containerMax,
    "--font-heading": tokens.typography.headingFont,
    "--font-body": tokens.typography.bodyFont,
    "--font-base-size": tokens.typography.baseSize,
    "--font-heading-weight": String(tokens.typography.headingWeight),
    "--font-body-weight": String(tokens.typography.bodyWeight),
  };
}

export function tokensToCssBlock(tokens: DesignTokens, selector = ":root"): string {
  const vars = tokensToCssVariables(tokens);
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  return `${selector} {\n${lines.join("\n")}\n}`;
}