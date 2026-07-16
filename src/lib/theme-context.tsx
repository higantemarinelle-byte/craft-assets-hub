import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublishedTheme, adminGetTheme } from "./theme.functions";
import { DEFAULT_THEME, mergeTheme, type Theme } from "./theme";
import { useAuth } from "./auth";
import { designTokensToCssVariables } from "./storefront/tokens";
import { buildGoogleFontsHref } from "./storefront/fonts";
import { themeQueryKeys } from "./theme-query-keys";

const ThemeCtx = createContext<{ theme: Theme; isDraftPreview: boolean }>({ theme: DEFAULT_THEME, isDraftPreview: false });

function useIsDraftPreview() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("theme") === "draft";
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isOwner } = useAuth();
  // Draft preview is gated on Craft Studio owner access, not general staff.
  const draftPreview = useIsDraftPreview() && isOwner;

  const { data } = useQuery({
    queryKey: themeQueryKeys.published,
    queryFn: () => getPublishedTheme(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const { data: adminData } = useQuery({
    queryKey: themeQueryKeys.draft,
    queryFn: () => adminGetTheme(),
    enabled: draftPreview,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const theme = useMemo(() => {
    if (draftPreview && adminData) return mergeTheme(adminData.draft);
    if (data) return mergeTheme(data.theme);
    return DEFAULT_THEME;
  }, [data, adminData, draftPreview]);

  const cssText = useMemo(() => {
    const vars = designTokensToCssVariables(theme.tokens);
    const lines = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join("\n  ");
    return `.storefront-theme {\n  ${lines}\n}`;
  }, [theme.tokens]);

  // Load Google Fonts for the selected typography — only what's needed.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = buildGoogleFontsHref([theme.tokens.typography.headingFont, theme.tokens.typography.bodyFont]);
    if (!href) return;
    const id = "craft-studio-fonts";
    const existing = document.getElementById(id) as HTMLLinkElement | null;
    if (existing && existing.href === href) return;
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [theme.tokens.typography.headingFont, theme.tokens.typography.bodyFont]);

  return (
    <ThemeCtx.Provider value={{ theme, isDraftPreview: draftPreview }}>
      {/* Scoped CSS variables — only apply where .storefront-theme is set. */}
      <style dangerouslySetInnerHTML={{ __html: cssText }} />
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
