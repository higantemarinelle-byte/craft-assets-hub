// Shared config for the Navigation Builder and Footer Builder (004E).
// Constants live here so both editors, preview components, and the public
// storefront agree on the same set of internal routes, social platforms and
// safety limits.

export const INTERNAL_ROUTES: { value: string; label: string }[] = [
  { value: "/", label: "Home" },
  { value: "/shop", label: "Products" },
  { value: "/gang-sheet", label: "Custom Prints / Gang Sheets" },
  { value: "/how-it-works", label: "How It Works" },
  { value: "/about", label: "About / Contact" },
  { value: "/account", label: "My Projects" },
  { value: "/cart", label: "Project Cart" },
  { value: "/auth", label: "Sign in" },
];

export const INTERNAL_ROUTE_VALUES = INTERNAL_ROUTES.map((r) => r.value);

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "linkedin",
  "pinterest",
  "other",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

// Limits — intentionally generous but bounded so a malicious/broken draft
// can't blow up the payload or the storefront render.
export const NAV_LIMITS = {
  maxTopLevel: 12,
  maxChildren: 12,
  maxLabelLen: 60,
  maxHrefLen: 500,
  maxCartLabelLen: 32,
};

export const FOOTER_LIMITS = {
  maxColumns: 6,
  maxLinksPerColumn: 12,
  maxSocials: 12,
  maxHeadingLen: 40,
  maxLabelLen: 60,
  maxHrefLen: 500,
  maxBusinessNameLen: 80,
  maxDescriptionLen: 400,
  maxCopyrightLen: 200,
  maxContactLen: 200,
};

// URL safety — mirrors what the server-side validator rejects.
const UNSAFE_PROTOCOLS = /^\s*(javascript|data|vbscript|file):/i;
const HAS_SCRIPT_TAG = /<\s*script/i;

export function isSafeExternalUrl(raw: string): boolean {
  const v = raw.trim();
  if (!v) return false;
  if (UNSAFE_PROTOCOLS.test(v)) return false;
  if (HAS_SCRIPT_TAG.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" || u.protocol === "mailto:" || u.protocol === "tel:";
  } catch {
    return false;
  }
}

export function isSafeInternalHref(raw: string): boolean {
  const v = raw.trim();
  if (!v.startsWith("/")) return false;
  if (UNSAFE_PROTOCOLS.test(v)) return false;
  if (HAS_SCRIPT_TAG.test(v)) return false;
  if (v.length > NAV_LIMITS.maxHrefLen) return false;
  return true;
}

export function currentYearReplace(text: string): string {
  return (text ?? "").replace(/\{year\}/gi, String(new Date().getFullYear()));
}

// Generate short random ids without pulling in extra deps.
export function newId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}