// Centralized React Query keys for the theme. Keep in sync across
// ThemeProvider, ThemeBuilder, site editors, and version history so
// invalidations always hit the right caches.
export const themeQueryKeys = {
  admin: ["theme", "admin"] as const,
  draft: ["theme", "draft"] as const,
  published: ["theme", "published"] as const,
  versions: ["theme", "versions"] as const,
};