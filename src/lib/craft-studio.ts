// Craft Studio module descriptors. Runtime status/timestamps come from
// `adminGetCraftStudioStatus` (src/lib/craft-studio.functions.ts) — never
// from hardcoded values here.

export type CraftModuleStatus = "available" | "coming_soon";

export type CraftModuleId =
  | "homepage"
  | "theme"
  | "navigation"
  | "footer"
  | "announcement"
  | "gallery"
  | "seo"
  | "media_library"
  | "campaigns"
  | "drafts"
  | "publish";

export type CraftModule = {
  id: CraftModuleId;
  title: string;
  description: string;
  status: CraftModuleStatus;
  href?: string;
  quickActionLabel: string;
};

export const CRAFT_MODULES: CraftModule[] = [
  {
    id: "homepage",
    title: "Homepage",
    description: "Hero, marquee, homepage sections, ordering and visibility.",
    status: "available",
    href: "/portal-admin/theme?panel=homepage",
    quickActionLabel: "Edit homepage",
  },
  {
    id: "theme",
    title: "Theme",
    description: "Visual Theme Builder — colours, typography, buttons, layout, presets and version history.",
    status: "available",
    href: "/portal-admin/theme?panel=theme",
    quickActionLabel: "Open Theme Builder",
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "Header menu, links, and site structure.",
    status: "available",
    href: "/portal-admin/craft-studio/navigation",
    quickActionLabel: "Edit navigation",
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer columns, contact info, and social links.",
    status: "available",
    href: "/portal-admin/craft-studio/footer",
    quickActionLabel: "Edit footer",
  },
  {
    id: "announcement",
    title: "Announcement Bar",
    description: "Site-wide banner for promos and updates.",
    status: "available",
    href: "/portal-admin/theme?panel=announcement",
    quickActionLabel: "Edit announcement",
  },
  {
    id: "gallery",
    title: "Gallery",
    description: "Showcase past projects and customer work.",
    status: "coming_soon",
    quickActionLabel: "Manage gallery",
  },
  {
    id: "seo",
    title: "SEO",
    description: "Titles, meta descriptions, and Open Graph settings.",
    status: "coming_soon",
    quickActionLabel: "Edit SEO",
  },
  {
    id: "media_library",
    title: "Media Library",
    description: "Manage banners, gallery images, logos and future media assets.",
    status: "available",
    href: "/portal-admin/craft-studio/assets",
    quickActionLabel: "Open library",
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Manage seasonal storefront campaigns (Christmas, Father's Day, Back to School, Summer).",
    status: "coming_soon",
    quickActionLabel: "Plan campaign",
  },
  {
    id: "drafts",
    title: "Drafts",
    description: "Work-in-progress storefront changes before they go live.",
    status: "available",
    href: "/portal-admin/theme?panel=draft",
    quickActionLabel: "Review draft",
  },
  {
    id: "publish",
    title: "Publish",
    description: "Push draft changes live and manage version history.",
    status: "available",
    href: "/portal-admin/theme?panel=history",
    quickActionLabel: "Publish changes",
  },
];

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
