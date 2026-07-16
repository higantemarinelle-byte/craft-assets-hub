// Shared theme type + defaults. Kept as plain types (client-safe).

import {
  DEFAULT_DESIGN_TOKENS,
  mergeDesignTokens,
  type StorefrontDesignTokens,
} from "@/lib/storefront/tokens";
import { newId, type SocialPlatform } from "@/lib/storefront/site-config";

export type ThemeSocial = { kind: "instagram" | "tiktok" | "twitter" | "facebook" | "email"; href: string };
export type ThemeLink = { label: string; href: string };
export type ThemeFooterColumn = { title: string; links: ThemeLink[] };
export type ThemeTestimonial = { quote: string; author: string };

// ---------- 004E: Navigation + Footer typed schemas ----------

export type NavigationLink = {
  id: string;
  label: string;
  type: "internal" | "external";
  href: string;
  enabled: boolean;
  openInNewTab: boolean;
  children: NavigationLink[];
};

export type StorefrontNavigation = {
  links: NavigationLink[];
  showSearch: boolean;
  showAccount: boolean;
  showProjectCart: boolean;
  projectCartLabel: string;
  stickyHeader: boolean;
};

export type FooterLink = {
  id: string;
  label: string;
  type: "internal" | "external";
  href: string;
  enabled: boolean;
  openInNewTab: boolean;
};

export type FooterColumnV2 = {
  id: string;
  heading: string;
  enabled: boolean;
  links: FooterLink[];
};

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  enabled: boolean;
};

export type StorefrontFooter = {
  enabled: boolean;
  logoAssetId: string | null;
  logoUrl: string | null;
  businessName: string;
  description: string;
  columns: FooterColumnV2[];
  contact: {
    enabled: boolean;
    email: string;
    phone: string;
    address: string;
  };
  socialLinks: SocialLink[];
  copyrightText: string;
  showPoweredBy: boolean;
};

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
  /** Legacy header link list — kept for backward compatibility. */
  nav: { items: ThemeLink[] };
  /** 004E: Navigation Builder output. Renders the public header. */
  navigation: StorefrontNavigation;
  /** Legacy footer object — kept for backward compatibility. */
  footer: {
    blurb: string;
    columns: ThemeFooterColumn[];
    socials: ThemeSocial[];
    contactEmail?: string;
    legal?: string;
  };
  /** 004E: Footer Builder output. Renders the public footer. */
  footerV2: StorefrontFooter;
  home: {
    hero: {
      eyebrow: string;
      headlineA: string;
      headlineHighlightA: string;
      headlineB: string;
      headlineHighlightB: string;
      /** 004D.3 — Independent per-segment hero colours. Null = use fallback. */
      headlineAColor: string | null;
      headlineHighlightAColor: string | null;
      headlineBColor: string | null;
      headlineHighlightBColor: string | null;
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
  tokens: StorefrontDesignTokens;
};

export const DEFAULT_THEME: Theme = {
  brand: { name: "Craft & Cling", tagline: "Crafted with care. Made to cling.", logoAssetId: null, logoUrl: null, primary: "#ec3b83", accent: "#00b6d8" },
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
  navigation: {
    links: [
      { id: "n_home", label: "Home", type: "internal", href: "/", enabled: true, openInNewTab: false, children: [] },
      { id: "n_products", label: "Products", type: "internal", href: "/shop", enabled: true, openInNewTab: false, children: [] },
      { id: "n_custom", label: "Custom Prints", type: "internal", href: "/gang-sheet", enabled: true, openInNewTab: false, children: [] },
      { id: "n_how", label: "How It Works", type: "internal", href: "/how-it-works", enabled: true, openInNewTab: false, children: [] },
      { id: "n_about", label: "About", type: "internal", href: "/about", enabled: true, openInNewTab: false, children: [] },
    ],
    showSearch: true,
    showAccount: true,
    showProjectCart: true,
    projectCartLabel: "Project Cart",
    stickyHeader: true,
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
  footerV2: {
    enabled: true,
    logoAssetId: null,
    logoUrl: null,
    businessName: "Craft & Cling",
    description: "Premium DTF transfers and custom printing. Upload your artwork, build a project, and we'll guide you through every step.",
    columns: [
      {
        id: "c_explore",
        heading: "Explore",
        enabled: true,
        links: [
          { id: "l_products", label: "Products", type: "internal", href: "/shop", enabled: true, openInNewTab: false },
          { id: "l_gang", label: "Gang sheets", type: "internal", href: "/gang-sheet", enabled: true, openInNewTab: false },
        ],
      },
      {
        id: "c_learn",
        heading: "Learn",
        enabled: true,
        links: [
          { id: "l_how", label: "How it works", type: "internal", href: "/how-it-works", enabled: true, openInNewTab: false },
          { id: "l_about", label: "About us", type: "internal", href: "/about", enabled: true, openInNewTab: false },
        ],
      },
    ],
    contact: {
      enabled: true,
      email: "hello@craftandcling.com",
      phone: "",
      address: "",
    },
    socialLinks: [
      { id: "s_ig", platform: "instagram", label: "Instagram", url: "https://instagram.com", enabled: true },
    ],
    copyrightText: "© {year} Craft & Cling. All rights reserved.",
    showPoweredBy: false,
  },
  home: {
    hero: {
      eyebrow: "Custom DTF · Made to order",
      headlineA: "Bring Your",
      headlineHighlightA: "Ideas",
      headlineB: "to",
      headlineHighlightB: "Life.",
      headlineAColor: null,
      headlineHighlightAColor: null,
      headlineBColor: null,
      headlineHighlightBColor: null,
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
  tokens: DEFAULT_DESIGN_TOKENS,
};

// Deep-merge helper — user drafts may omit fields; fill in with defaults.
// Older themes (pre-004D) do not include `tokens`; when missing, we seed
// tokens from the legacy `brand.primary` / `brand.accent` values so the
// upgrade is invisible.
export function mergeTheme(partial: any): Theme {
  const p = partial ?? {};
  const brand = { ...DEFAULT_THEME.brand, ...(p.brand ?? {}) };

  let tokens: StorefrontDesignTokens;
  if (p.tokens) {
    tokens = mergeDesignTokens(p.tokens);
  } else {
    // Legacy themes stored raw brand.primary/accent (e.g. bright pink/cyan)
    // which previously drove the entire storefront palette. That palette
    // is intentionally muted now — cream paper + ink, with magenta/cyan
    // reserved as poster accents — so ignore legacy brand colors and use
    // the default design tokens when no explicit tokens were saved.
    tokens = DEFAULT_DESIGN_TOKENS;
  }

  return {
    brand,
    announcement: { ...DEFAULT_THEME.announcement, ...(p.announcement ?? {}) },
    nav: { items: p.nav?.items ?? DEFAULT_THEME.nav.items },
    navigation: mergeNavigation(p.navigation, p.nav?.items),
    footer: { ...DEFAULT_THEME.footer, ...(p.footer ?? {}) },
    footerV2: mergeFooterV2(p.footerV2, p.footer),
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
    tokens,
  };
}

// ---------- 004E migration helpers ----------

function migrateLegacyNavItems(items: any[] | undefined): NavigationLink[] {
  if (!Array.isArray(items) || items.length === 0) return DEFAULT_THEME.navigation.links;
  return items
    .filter((x) => x && typeof x.label === "string" && typeof x.href === "string")
    .map<NavigationLink>((it) => ({
      id: newId("n"),
      label: String(it.label),
      type: /^https?:\/\//i.test(it.href) ? "external" : "internal",
      href: String(it.href),
      enabled: true,
      openInNewTab: false,
      children: [],
    }));
}

function normalizeNavLink(raw: any): NavigationLink | null {
  if (!raw || typeof raw.label !== "string" || typeof raw.href !== "string") return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId("n"),
    label: String(raw.label),
    type: raw.type === "external" ? "external" : "internal",
    href: String(raw.href),
    enabled: raw.enabled !== false,
    openInNewTab: !!raw.openInNewTab,
    children: Array.isArray(raw.children)
      ? raw.children.map(normalizeNavLink).filter((x: NavigationLink | null): x is NavigationLink => !!x).map((c: NavigationLink) => ({ ...c, children: [] }))
      : [],
  };
}

function mergeNavigation(nav: any, legacyItems: any[] | undefined): StorefrontNavigation {
  const d = DEFAULT_THEME.navigation;
  if (!nav || !Array.isArray(nav.links)) {
    // No new-shape navigation yet — migrate legacy items if present.
    return {
      links: migrateLegacyNavItems(legacyItems),
      showSearch: nav?.showSearch ?? d.showSearch,
      showAccount: nav?.showAccount ?? d.showAccount,
      showProjectCart: nav?.showProjectCart ?? d.showProjectCart,
      projectCartLabel: nav?.projectCartLabel ?? d.projectCartLabel,
      stickyHeader: nav?.stickyHeader ?? d.stickyHeader,
    };
  }
  const links = nav.links
    .map(normalizeNavLink)
    .filter((x: NavigationLink | null): x is NavigationLink => !!x);
  return {
    links: links.length ? links : d.links,
    showSearch: nav.showSearch ?? d.showSearch,
    showAccount: nav.showAccount ?? d.showAccount,
    showProjectCart: nav.showProjectCart ?? d.showProjectCart,
    projectCartLabel: typeof nav.projectCartLabel === "string" && nav.projectCartLabel ? nav.projectCartLabel : d.projectCartLabel,
    stickyHeader: nav.stickyHeader ?? d.stickyHeader,
  };
}

function normalizeFooterLink(raw: any): FooterLink | null {
  if (!raw || typeof raw.label !== "string" || typeof raw.href !== "string") return null;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : newId("l"),
    label: String(raw.label),
    type: raw.type === "external" ? "external" : "internal",
    href: String(raw.href),
    enabled: raw.enabled !== false,
    openInNewTab: !!raw.openInNewTab,
  };
}

function migrateLegacyFooter(legacy: any): FooterColumnV2[] {
  const cols = Array.isArray(legacy?.columns) ? legacy.columns : [];
  return cols
    .map((c: any): FooterColumnV2 | null => {
      if (!c || typeof c.title !== "string") return null;
      const links: FooterLink[] = Array.isArray(c.links)
        ? c.links
            .filter((l: any) => l && typeof l.label === "string" && typeof l.href === "string")
            .map((l: any): FooterLink => ({
              id: newId("l"),
              label: String(l.label),
              type: /^https?:\/\//i.test(l.href) ? "external" : "internal",
              href: String(l.href),
              enabled: true,
              openInNewTab: false,
            }))
        : [];
      return { id: newId("c"), heading: String(c.title), enabled: true, links };
    })
    .filter((x: FooterColumnV2 | null): x is FooterColumnV2 => !!x);
}

function migrateLegacySocials(legacy: any): SocialLink[] {
  const socials = Array.isArray(legacy?.socials) ? legacy.socials : [];
  const map: Record<string, SocialPlatform> = {
    instagram: "instagram",
    tiktok: "tiktok",
    facebook: "facebook",
    linkedin: "linkedin",
    pinterest: "pinterest",
    youtube: "youtube",
  };
  return (socials as any[])
    .filter((s: any) => s && typeof s.href === "string")
    .map((s: any): SocialLink => {
      const platform: SocialPlatform = map[String(s.kind).toLowerCase()] ?? "other";
      return {
        id: newId("s"),
        platform,
        label: platform === "other" ? "Link" : platform[0].toUpperCase() + platform.slice(1),
        url: String(s.href),
        enabled: true,
      };
    });
}

function mergeFooterV2(v2: any, legacy: any): StorefrontFooter {
  const d = DEFAULT_THEME.footerV2;
  if (!v2 || typeof v2 !== "object") {
    const migrated = migrateLegacyFooter(legacy);
    const socials = migrateLegacySocials(legacy);
    return {
      enabled: true,
      logoAssetId: null,
      logoUrl: null,
      businessName: DEFAULT_THEME.brand.name,
      description: typeof legacy?.blurb === "string" ? legacy.blurb : d.description,
      columns: migrated.length ? migrated : d.columns,
      contact: {
        enabled: !!(legacy?.contactEmail),
        email: typeof legacy?.contactEmail === "string" ? legacy.contactEmail : "",
        phone: "",
        address: "",
      },
      socialLinks: socials.length ? socials : d.socialLinks,
      copyrightText: typeof legacy?.legal === "string" && legacy.legal ? legacy.legal : d.copyrightText,
      showPoweredBy: false,
    };
  }
  const columns: FooterColumnV2[] = Array.isArray(v2.columns)
    ? v2.columns
        .map((c: any): FooterColumnV2 | null => {
          if (!c || typeof c.heading !== "string") return null;
          const links: FooterLink[] = Array.isArray(c.links)
            ? c.links.map(normalizeFooterLink).filter((l: FooterLink | null): l is FooterLink => !!l)
            : [];
          return {
            id: typeof c.id === "string" && c.id ? c.id : newId("c"),
            heading: String(c.heading),
            enabled: c.enabled !== false,
            links,
          };
        })
        .filter((x: FooterColumnV2 | null): x is FooterColumnV2 => !!x)
    : d.columns;
  const socialLinks: SocialLink[] = Array.isArray(v2.socialLinks)
    ? v2.socialLinks
        .map((s: any): SocialLink | null => {
          if (!s || typeof s.url !== "string") return null;
          const platform: SocialPlatform = (["facebook","instagram","youtube","tiktok","linkedin","pinterest","other"] as const).includes(s.platform)
            ? s.platform
            : "other";
          return {
            id: typeof s.id === "string" && s.id ? s.id : newId("s"),
            platform,
            label: typeof s.label === "string" ? s.label : platform,
            url: String(s.url),
            enabled: s.enabled !== false,
          };
        })
        .filter((x: SocialLink | null): x is SocialLink => !!x)
    : d.socialLinks;
  return {
    enabled: v2.enabled !== false,
    logoAssetId: typeof v2.logoAssetId === "string" ? v2.logoAssetId : null,
    logoUrl: typeof v2.logoUrl === "string" ? v2.logoUrl : null,
    businessName: typeof v2.businessName === "string" ? v2.businessName : d.businessName,
    description: typeof v2.description === "string" ? v2.description : d.description,
    columns,
    contact: {
      enabled: v2?.contact?.enabled !== false,
      email: typeof v2?.contact?.email === "string" ? v2.contact.email : "",
      phone: typeof v2?.contact?.phone === "string" ? v2.contact.phone : "",
      address: typeof v2?.contact?.address === "string" ? v2.contact.address : "",
    },
    socialLinks,
    copyrightText: typeof v2.copyrightText === "string" ? v2.copyrightText : d.copyrightText,
    showPoweredBy: !!v2.showPoweredBy,
  };
}

/** Sync legacy `brand.primary` / `brand.accent` from tokens so older
 *  storefront code paths that still read them stay consistent. Called
 *  before persisting a draft. */
export function syncLegacyBrandFromTokens(theme: Theme): Theme {
  return {
    ...theme,
    brand: {
      ...theme.brand,
      primary: theme.tokens.colors.primary,
      accent: theme.tokens.colors.accent,
    },
  };
}
