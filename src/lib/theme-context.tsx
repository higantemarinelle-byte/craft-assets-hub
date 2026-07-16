import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublishedTheme, adminGetTheme } from "./theme.functions";
import { DEFAULT_THEME, mergeTheme, type Theme } from "./theme";
import { useAuth } from "./auth";

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
  const { isStaff } = useAuth();
  const draftPreview = useIsDraftPreview() && isStaff;

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

  return <ThemeCtx.Provider value={{ theme, isDraftPreview: draftPreview }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
