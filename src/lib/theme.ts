// Shared theme type + defaults. Kept as plain types (client-safe).

export type ThemeSocial = { kind: "instagram" | "tiktok" | "twitter" | "facebook" | "email"; href: string };
export type ThemeLink = { label: string; href: string };
export type ThemeFooterColumn = { title: string; links: ThemeLink[] };
export type ThemeTestimonial = { quote: string; author: string };

export type ThemeHomeSection =
  | { id: string; type: "categories"; enabled: boolean; title?: string }
  | { id: string; type: "featured"; enabled: boolean; title?: string; eyebrow?: string }
  | { id: string; type: "how"; enabled: boolean; title?: string; eyebrow?: string }
  | { id: string; type: "testimonials"; enabled: boolean; title?: string; items: ThemeTestimonial[] }
  | { id: string; type: "banner"; enabled: boolean; title?: string; body?: string; ctaLabel?: string; ctaHref?: string; bg?: string };

export type Theme = {
  brand: {
    name: string;
    tagline: string;
    /** Asset ID from craft_assets — new source of truth. */
    logoAssetId: string | null;
    /** Legacy URL — kept for backward compatibility with existing drafts. */
    logoUrl: string | null;
    primary: string;
    accent: string;
  };
  announcement: { enabled: boolean; text: string; link?: string };
  nav: { items: ThemeLink[] };
  footer: {
    blurb: string;
    columns: ThemeFooterColumn[];
    socials: ThemeSocial[];
    contactEmail?: string;
    legal?: string;
  };
  home: {
    hero: {
      eyebrow: string;
      headlineA: string;
      headlineHighlightA: string;
      headlineB: string;
      headlineHighlightB: string;
      body: string;
      ctaPrimaryLabel: string;
      ctaPrimaryHref: string;
      ctaSecondaryLabel: string;
      ctaSecondaryHref: string;
      /** Asset ID from craft_assets — new source of truth. */
      imageAssetId: string | null;
      /** Legacy URL — kept for backward compatibility with existing drafts. */
      imageUrl: string | null;
    };
    marquee: { enabled: boolean; items: string[] };
    sections: ThemeHomeSection[];
  };
  pages: {
    shop: { banner: { title: string; body: string } };
    product: { trustBadges: string[] };
    about: { blocks: Array<{ heading: string; body: string }> };
  };
  inventory: { lowStockThreshold: number };
};

export const DEFAULT_THEME: Theme = {
  brand: { name: "Craft & Cling", tagline: "Bring your ideas to life.", logoAssetId: null, logoUrl: null, primary: "#ec3b83", accent: "#00b6d8" },
  announcement: { enabled: true, text: "Upload artwork · Build a project · We'll quote within 24 hours", link: "/shop" },
  nav: {
    items: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/shop" },
      { label: "Custom Prints", href: "/gang-sheet" },
      { label: "Gang Sheets", href: "/gang-sheet" },
      { label: "Gallery", href: "/shop" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/about" },
      { label: "My Projects", href: "/account" },
      { label: "Project Cart", href: "/cart" },
    ],
  },
  footer: {
    blurb: "Premium DTF transfers and custom printing. Upload your artwork, build a project, and we'll guide you through every step.",
    columns: [
      { title: "Explore", links: [{ label: "Products", href: "/shop" }, { label: "Gang sheets", href: "/gang-sheet" }] },
      { title: "Learn", links: [{ label: "How it works", href: "/how-it-works" }, { label: "About us", href: "/about" }] },
    ],
    socials: [
      { kind: "instagram", href: "https://instagram.com" },
      { kind: "email", href: "mailto:hello@craftandcling.com" },
    ],
    contactEmail: "hello@craftandcling.com",
    legal: "© Craft & Cling",
  },
  home: {
    hero: {
      eyebrow: "Custom DTF · Made to order",
      headlineA: "Bring Your",
      headlineHighlightA: "Ideas",
      headlineB: "to",
      headlineHighlightB: "Life.",
      body: "Premium DTF transfers and custom printing for creators, businesses, and brands. Upload your artwork, build your project, and we'll guide you through every step.",
      ctaPrimaryLabel: "Start a Project",
      ctaPrimaryHref: "/shop",
      ctaSecondaryLabel: "Explore Products",
      ctaSecondaryHref: "/shop",
      imageAssetId: null,
      imageUrl: null,
    },
    marquee: { enabled: true, items: ["Upload your artwork", "Free quotations", "No minimums", "Custom sizes welcome", "Reply within 24 hours"] },
    sections: [
      { id: "categories", type: "categories", enabled: true, title: "Explore by category" },
      { id: "featured", type: "featured", enabled: true, title: "Popular designs", eyebrow: "Ready to customize" },
      { id: "how", type: "how", enabled: true, title: "How it works", eyebrow: "Four simple steps" },
      { id: "testimonials", type: "testimonials", enabled: true, title: "Makers who create with us", items: [] },
    ],
  },
  pages: {
    shop: { banner: { title: "All transfers", body: "Ready-to-press DTF designs, sized and priced for makers." } },
    product: { trustBadges: ["48h turnaround", "Vibrant CMYK+W", "Free shipping $75+"] },
    about: { blocks: [{ heading: "Built by makers, for makers", body: "We started Craft & Cling because DTF should be loud, reliable, and shipped on time." }] },
  },
  inventory: { lowStockThreshold: 10 },
};

// Deep-merge helper — user drafts may omit fields; fill in with defaults.
export function mergeTheme(partial: any): Theme {
  const p = partial ?? {};
  return {
    brand: { ...DEFAULT_THEME.brand, ...(p.brand ?? {}) },
    announcement: { ...DEFAULT_THEME.announcement, ...(p.announcement ?? {}) },
    nav: { items: p.nav?.items ?? DEFAULT_THEME.nav.items },
    footer: { ...DEFAULT_THEME.footer, ...(p.footer ?? {}) },
    home: {
      hero: { ...DEFAULT_THEME.home.hero, ...(p.home?.hero ?? {}) },
      marquee: { ...DEFAULT_THEME.home.marquee, ...(p.home?.marquee ?? {}) },
      sections: p.home?.sections ?? DEFAULT_THEME.home.sections,
    },
    pages: {
      shop: { banner: { ...DEFAULT_THEME.pages.shop.banner, ...(p.pages?.shop?.banner ?? {}) } },
      product: { trustBadges: p.pages?.product?.trustBadges ?? DEFAULT_THEME.pages.product.trustBadges },
      about: { blocks: p.pages?.about?.blocks ?? DEFAULT_THEME.pages.about.blocks },
    },
    inventory: { ...DEFAULT_THEME.inventory, ...(p.inventory ?? {}) },
  };
}
