// Craft Studio dashboard descriptors. Runtime status/timestamps come from
// `adminGetCraftStudioStatus` (src/lib/craft-studio.functions.ts) — never
// from hardcoded values here.


// ---------- Grouped dashboard ----------
// The dashboard shows three real groups instead of one card per Theme
// Builder panel; the builder's own sidebar already covers that navigation.

export type CraftGroupId = "storefront_editor" | "media_library" | "publishing";

export type CraftGroup = {
  id: CraftGroupId;
  title: string;
  description: string;
  primary: { label: string; href: string };
  links: { label: string; href: string }[];
};

export const CRAFT_GROUPS: CraftGroup[] = [
  {
    id: "storefront_editor",
    title: "Storefront Editor",
    description: "Theme, homepage sections, hero, announcement bar, navigation and footer.",
    primary: { label: "Open Storefront Editor", href: "/portal-admin/theme" },
    links: [
      { label: "Homepage", href: "/portal-admin/theme?panel=homepage" },
      { label: "Theme", href: "/portal-admin/theme?panel=theme" },
      { label: "Announcement", href: "/portal-admin/theme?panel=announcement" },
      { label: "Navigation", href: "/portal-admin/craft-studio/navigation" },
      { label: "Footer", href: "/portal-admin/craft-studio/footer" },
    ],
  },
  {
    id: "media_library",
    title: "Media Library",
    description: "Banners, gallery images, logos and other storefront media assets.",
    primary: { label: "Open library", href: "/portal-admin/craft-studio/assets" },
    links: [],
  },
  {
    id: "publishing",
    title: "Publishing",
    description: "Review the current draft, publish it live, and browse version history.",
    primary: { label: "Review & publish", href: "/portal-admin/theme?panel=draft" },
    links: [{ label: "Version history", href: "/portal-admin/theme?panel=history" }],
  },
];

export const CRAFT_COMING_SOON = ["Gallery", "SEO", "Campaigns", "AI assistants"];

export type StorefrontStatus = {
  storefront: "live" | "offline";
  hasUnpublishedChanges: boolean;
  lastPublished: string | null;
  lastUpdated: string | null;
  currentTheme: string;
};

/** Absolute, human readable: "24 Aug 2026, 7:30 AM". */
export function formatAbsolute(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative: "12 minutes ago". Falls back to the absolute date when old. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Never";
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatAbsolute(iso);
}
