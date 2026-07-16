import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublishedTheme, adminGetTheme } from "./theme.functions";
import { DEFAULT_THEME, mergeTheme, type Theme } from "./theme";
import { useAuth } from "./auth";
import { designTokensToCssVariables } from "./storefront/tokens";

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
    queryKey: ["theme:published"],
    queryFn: () => getPublishedTheme(),
    staleTime: 60_000,
  });
  const { data: adminData } = useQuery({
    queryKey: ["theme:draft"],
    queryFn: () => adminGetTheme(),
    enabled: draftPreview,
    staleTime: 10_000,
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
