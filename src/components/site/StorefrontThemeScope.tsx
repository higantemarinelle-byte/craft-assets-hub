// Applies the storefront design tokens by scoping `.storefront-theme` to a
// wrapper element. Craft OS (portal-admin/*) intentionally sits outside
// this scope, so token changes cannot make the admin unreadable.

import type { ReactNode, CSSProperties } from "react";
import { useMemo } from "react";
import { designTokensToCssVariables } from "@/lib/storefront/tokens";
import { useTheme } from "@/lib/theme-context";
import type { StorefrontDesignTokens } from "@/lib/storefront/tokens";

type Props = {
  children: ReactNode;
  className?: string;
  /** Optional override — the Theme Builder preview passes unsaved tokens. */
  tokens?: StorefrontDesignTokens;
};

export function StorefrontThemeScope({ children, className = "", tokens }: Props) {
  const { theme } = useTheme();
  const active = tokens ?? theme.tokens;
  const style = useMemo(() => designTokensToCssVariables(active) as CSSProperties, [active]);
  return (
    <div className={`storefront-theme ${className}`} style={style}>
      {children}
    </div>
  );
}