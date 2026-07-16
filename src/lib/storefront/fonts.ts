// Controlled font registry for the Theme Builder.
// Only fonts listed here can be selected — no arbitrary URLs are accepted.

export type FontCategory = "sans" | "serif" | "display" | "system";

export type FontOption = {
  id: string;
  name: string;
  stack: string;                   // CSS font-family value
  category: FontCategory;
  weights: number[];               // available weights
  google?: string;                 // Google Fonts family name (encoded via + like "Space+Grotesk")
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    stack: '"Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    category: "display",
    weights: [500, 600, 700],
    google: "Space+Grotesk",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    stack: '"DM Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    category: "sans",
    weights: [400, 500, 600, 700],
    google: "DM+Sans",
  },
  {
    id: "inter",
    name: "Inter",
    stack: '"Inter", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    category: "sans",
    weights: [400, 500, 600, 700],
    google: "Inter",
  },
  {
    id: "poppins",
    name: "Poppins",
    stack: '"Poppins", system-ui, sans-serif',
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    google: "Poppins",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    stack: '"Montserrat", system-ui, sans-serif',
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    google: "Montserrat",
  },
  {
    id: "lora",
    name: "Lora",
    stack: '"Lora", Georgia, "Times New Roman", serif',
    category: "serif",
    weights: [400, 500, 600, 700],
    google: "Lora",
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    stack: '"Playfair Display", Georgia, "Times New Roman", serif',
    category: "display",
    weights: [500, 600, 700, 800, 900],
    google: "Playfair+Display",
  },
  {
    id: "system-sans",
    name: "System Sans",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    category: "system",
    weights: [400, 500, 600, 700],
  },
  {
    id: "system-serif",
    name: "System Serif",
    stack: 'ui-serif, Georgia, "Times New Roman", serif',
    category: "system",
    weights: [400, 500, 600, 700],
  },
];

export const FONT_IDS = FONT_OPTIONS.map((f) => f.id) as string[];

export const DEFAULT_FONT_STACKS: Record<string, string> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.id, f.stack]),
);

export function findFont(id: string): FontOption | undefined {
  return FONT_OPTIONS.find((f) => f.id === id);
}

/** Build a Google Fonts stylesheet URL for a given set of font IDs.
 *  Returns null when no selected fonts require the Google CDN. */
export function buildGoogleFontsHref(ids: string[]): string | null {
  const families = new Set<string>();
  for (const id of ids) {
    const f = findFont(id);
    if (!f?.google) continue;
    const weights = f.weights.join(";");
    families.add(`family=${f.google}:wght@${weights}`);
  }
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${Array.from(families).join("&")}&display=swap`;
}