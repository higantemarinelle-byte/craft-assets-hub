// Craft Studio configuration foundation. Future milestones will replace these
// in-memory descriptors with database-backed settings (theme, homepage, nav,
// footer, announcements, SEO, media library, drafts & published versions).

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
  lastUpdated?: string | null;
};

export const CRAFT_MODULES: CraftModule[] = [
  {
    id: "homepage",
    title: "Homepage",
    description: "Hero, featured sections, and homepage layout.",
    status: "coming_soon",
    quickActionLabel: "Edit homepage",
  },
  {
    id: "theme",
    title: "Theme",
    description: "Visual Theme Builder — colours, typography, buttons, layout, presets and version history.",
    status: "available",
    href: "/portal-admin/theme",
    quickActionLabel: "Open Theme Builder",
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "Header menu, links, and site structure.",
    status: "coming_soon",
    quickActionLabel: "Edit navigation",
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer columns, contact info, and social links.",
    status: "coming_soon",
    quickActionLabel: "Edit footer",
  },
  {
    id: "announcement",
    title: "Announcement Bar",
    description: "Site-wide banner for promos and updates.",
    status: "coming_soon",
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
    status: "coming_soon",
    quickActionLabel: "Review drafts",
  },
  {
    id: "publish",
    title: "Publish",
    description: "Push draft changes live and manage version history.",
    status: "coming_soon",
    quickActionLabel: "Publish changes",
  },
];

export type StorefrontStatus = {
  storefront: "live" | "offline";
  draftStatus: "no_draft" | "draft_pending";
  lastPublished: string | null;
  lastUpdated: string | null;
  currentTheme: string;
};

export const DEFAULT_STOREFRONT_STATUS: StorefrontStatus = {
  storefront: "live",
  draftStatus: "no_draft",
  lastPublished: null,
  lastUpdated: null,
  currentTheme: "Craft & Cling default",
};
