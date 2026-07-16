// Design-token editors used by the Craft Studio Theme Builder.
// Grouped in one file to keep the module structure manageable while
// still keeping the ThemeBuilder route thin.

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/craft-studio/MediaPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

import type { Theme } from "@/lib/theme";
import type { StorefrontDesignTokens } from "@/lib/storefront/tokens";
import { DEFAULT_DESIGN_TOKENS, STOREFRONT_THEME_PRESETS } from "@/lib/storefront/tokens";
import { FONT_OPTIONS } from "@/lib/storefront/fonts";

type Updater = (fn: (t: Theme) => Theme) => void;

// ---------- Small primitives ----------

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-bold uppercase tracking-widest">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ResetButton({ onClick, title = "Reset to default" }: { onClick: () => void; title?: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" onClick={onClick} title={title} aria-label={title}>
      <RotateCcw className="h-3.5 w-3.5" />
    </Button>
  );
}

// Colour swatches — use text hex/oklch values.
function ColorField({
  label, value, onChange, hint, onReset,
}: { label: string; value: string; onChange: (v: string) => void; hint?: string; onReset: () => void }) {
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  return (
    <Row label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input type="color" value={isHex ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border" title="Pick color" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
        <ResetButton onClick={onReset} />
      </div>
    </Row>
  );
}

// ---------- Brand editor ----------

export function ThemeBrandEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-4">
      <Row label="Business name">
        <Input value={theme.brand.name} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, name: e.target.value } }))} />
      </Row>
      <Row label="Tagline">
        <Input value={theme.brand.tagline} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, tagline: e.target.value } }))} />
      </Row>
      <Row label="Logo" hint="Choose from the media library. Existing legacy image URLs still render if no Asset ID is set.">
        <MediaPicker
          value={theme.brand.logoAssetId ? { assetId: theme.brand.logoAssetId, url: theme.brand.logoUrl ?? "", alt: null, width: null, height: null } : null}
          onChange={(v) => update((t) => ({ ...t, brand: { ...t.brand, logoAssetId: v?.assetId ?? null, logoUrl: v?.url ?? t.brand.logoUrl } }))}
        />
      </Row>
    </div>
  );
}

// ---------- Colors editor ----------

type ColorKey = keyof StorefrontDesignTokens["colors"];
const COLOR_LABELS: Array<{ key: ColorKey; label: string; hint?: string }> = [
  { key: "background", label: "Background", hint: "Main page background." },
  { key: "foreground", label: "Foreground", hint: "Body text on the background." },
  { key: "surface", label: "Surface", hint: "Cards, panels, modals." },
  { key: "surfaceForeground", label: "Surface text" },
  { key: "primary", label: "Primary", hint: "Main brand action colour." },
  { key: "primaryForeground", label: "Primary text" },
  { key: "secondary", label: "Secondary", hint: "Accent colour for badges, links, ribbons." },
  { key: "secondaryForeground", label: "Secondary text" },
  { key: "accent", label: "Accent", hint: "Loud CTAs and highlights." },
  { key: "accentForeground", label: "Accent text" },
  { key: "highlight", label: "Highlight", hint: "Yellow-style callouts, badges." },
  { key: "highlightForeground", label: "Highlight text" },
  { key: "muted", label: "Muted" },
  { key: "mutedForeground", label: "Muted text" },
  { key: "border", label: "Border" },
  { key: "ring", label: "Focus ring" },
];

export function ThemeColorEditor({ theme, update }: { theme: Theme; update: Updater }) {
  const setColor = (k: ColorKey, v: string) => update((t) => ({ ...t, tokens: { ...t.tokens, colors: { ...t.tokens.colors, [k]: v } } }));
  const resetOne = (k: ColorKey) => setColor(k, DEFAULT_DESIGN_TOKENS.colors[k]);
  const resetAll = () => update((t) => ({ ...t, tokens: { ...t.tokens, colors: DEFAULT_DESIGN_TOKENS.colors } }));
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={resetAll}><RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset all colours</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {COLOR_LABELS.map((c) => (
          <ColorField
            key={c.key}
            label={c.label}
            hint={c.hint}
            value={theme.tokens.colors[c.key]}
            onChange={(v) => setColor(c.key, v)}
            onReset={() => resetOne(c.key)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Typography editor ----------

export function ThemeTypographyEditor({ theme, update }: { theme: Theme; update: Updater }) {
  const setTypo = <K extends keyof StorefrontDesignTokens["typography"]>(k: K, v: StorefrontDesignTokens["typography"][K]) =>
    update((t) => ({ ...t, tokens: { ...t.tokens, typography: { ...t.tokens.typography, [k]: v } } }));
  const resetAll = () => update((t) => ({ ...t, tokens: { ...t.tokens, typography: DEFAULT_DESIGN_TOKENS.typography } }));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={resetAll}><RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset typography</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Row label="Heading font">
          <Select value={theme.tokens.typography.headingFont} onValueChange={(v) => setTypo("headingFont", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="Body font">
          <Select value={theme.tokens.typography.bodyFont} onValueChange={(v) => setTypo("bodyFont", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="Base size">
          <Select value={theme.tokens.typography.baseSize} onValueChange={(v) => setTypo("baseSize", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["14px", "15px", "16px", "17px", "18px"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="Heading letter-spacing">
          <Select value={theme.tokens.typography.headingLetterSpacing} onValueChange={(v) => setTypo("headingLetterSpacing", v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{["-0.04em", "-0.03em", "-0.02em", "-0.01em", "0", "0.02em", "0.05em"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="Heading weight">
          <Select value={String(theme.tokens.typography.headingWeight)} onValueChange={(v) => setTypo("headingWeight", Number(v) as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[500, 600, 700, 800, 900].map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
        <Row label="Body weight">
          <Select value={String(theme.tokens.typography.bodyWeight)} onValueChange={(v) => setTypo("bodyWeight", Number(v) as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[300, 400, 500].map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}</SelectContent>
          </Select>
        </Row>
      </div>
      <div className="rounded border-2 border-ink/20 bg-cream/40 p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Preview</div>
        <div style={{ fontFamily: `var(--font-display)`, fontWeight: theme.tokens.typography.headingWeight, letterSpacing: theme.tokens.typography.headingLetterSpacing }} className="text-4xl">Bring ideas to life.</div>
        <div style={{ fontFamily: `var(--font-sans)`, fontSize: theme.tokens.typography.baseSize, fontWeight: theme.tokens.typography.bodyWeight }} className="mt-2 text-muted-foreground">Body text sample — custom transfers, printed loud, shipped fast.</div>
      </div>
    </div>
  );
}

// ---------- Button editor ----------

export function ThemeButtonEditor({ theme, update }: { theme: Theme; update: Updater }) {
  const setStyle = (style: "solid" | "outline" | "soft") => update((t) => ({ ...t, tokens: { ...t.tokens, buttons: { style } } }));
  const setRadius = (button: StorefrontDesignTokens["radius"]["button"]) => update((t) => ({ ...t, tokens: { ...t.tokens, radius: { ...t.tokens.radius, button } } }));
  return (
    <div className="space-y-4">
      <Row label="Button style">
        <div className="grid grid-cols-3 gap-2">
          {(["solid", "outline", "soft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              className={`rounded border-2 p-3 text-sm capitalize ${theme.tokens.buttons.style === s ? "border-ink bg-yellow" : "border-ink/20 bg-cream hover:border-ink"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Row>
      <Row label="Button corner radius">
        <Select value={theme.tokens.radius.button} onValueChange={(v) => setRadius(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Square</SelectItem>
            <SelectItem value="0.25rem">Sm</SelectItem>
            <SelectItem value="0.5rem">Md</SelectItem>
            <SelectItem value="0.75rem">Lg</SelectItem>
            <SelectItem value="1rem">XL</SelectItem>
            <SelectItem value="9999px">Pill</SelectItem>
          </SelectContent>
        </Select>
      </Row>
    </div>
  );
}

// ---------- Layout editor ----------

export function ThemeLayoutEditor({ theme, update }: { theme: Theme; update: Updater }) {
  const setRadius = <K extends keyof StorefrontDesignTokens["radius"]>(k: K, v: StorefrontDesignTokens["radius"][K]) =>
    update((t) => ({ ...t, tokens: { ...t.tokens, radius: { ...t.tokens.radius, [k]: v } } }));
  const setSpacing = <K extends keyof StorefrontDesignTokens["spacing"]>(k: K, v: StorefrontDesignTokens["spacing"][K]) =>
    update((t) => ({ ...t, tokens: { ...t.tokens, spacing: { ...t.tokens.spacing, [k]: v } } }));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Row label="Base radius">
        <Select value={theme.tokens.radius.base} onValueChange={(v) => setRadius("base", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["0", "0.25rem", "0.5rem", "0.75rem", "1rem", "1.25rem"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </Row>
      <Row label="Card radius">
        <Select value={theme.tokens.radius.card} onValueChange={(v) => setRadius("card", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["0", "0.5rem", "0.75rem", "1rem", "1.5rem", "2rem"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </Row>
      <Row label="Container width">
        <Select value={theme.tokens.spacing.containerMax} onValueChange={(v) => setSpacing("containerMax", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact (960px)</SelectItem>
            <SelectItem value="standard">Standard (1200px)</SelectItem>
            <SelectItem value="wide">Wide (1440px)</SelectItem>
            <SelectItem value="full">Full width</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row label="Container padding">
        <Select value={theme.tokens.spacing.containerPadding} onValueChange={(v) => setSpacing("containerPadding", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="generous">Generous</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row label="Section spacing">
        <Select value={theme.tokens.spacing.section} onValueChange={(v) => setSpacing("section", v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tight">Tight</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="relaxed">Relaxed</SelectItem>
            <SelectItem value="spacious">Spacious</SelectItem>
          </SelectContent>
        </Select>
      </Row>
    </div>
  );
}

// ---------- Presets ----------

export function ThemePresetPicker({ update, onApply }: { update: Updater; onApply: () => void }) {
  const apply = (id: string) => {
    const preset = STOREFRONT_THEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    if (!window.confirm(`Apply preset "${preset.name}"? This updates colours, fonts and layout only. Content stays untouched.`)) return;
    update((t) => ({ ...t, tokens: preset.tokens }));
    onApply();
  };
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {STOREFRONT_THEME_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => apply(p.id)}
          className="rounded-lg border-2 border-ink/20 bg-cream p-4 text-left transition hover:border-ink"
        >
          <div className="mb-2 flex gap-1">
            {[p.tokens.colors.primary, p.tokens.colors.secondary, p.tokens.colors.accent, p.tokens.colors.highlight, p.tokens.colors.background].map((c, i) => (
              <span key={i} className="h-6 w-6 rounded border border-ink/20" style={{ background: c }} />
            ))}
          </div>
          <div className="text-display text-lg">{p.name}</div>
          <div className="text-xs text-muted-foreground">{p.description}</div>
        </button>
      ))}
    </div>
  );
}