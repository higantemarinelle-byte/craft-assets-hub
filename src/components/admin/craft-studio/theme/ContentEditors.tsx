// Storefront content editors (announcement / homepage / navigation / footer /
// pages / inventory / commerce). Each editor is exported individually so the
// Shopify-style Theme Builder sidebar can render them as focused panels,
// while `ThemeContentEditor` keeps the original tabbed composition.

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, ChevronRight } from "lucide-react";
import { MediaPicker } from "@/components/admin/craft-studio/MediaPicker";
import type { Theme, ThemeHomeSection } from "@/lib/theme";
import { SUPPORTED_CURRENCY_CODES } from "@/lib/theme";

type Updater = (fn: (t: Theme) => Theme) => void;

export function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | null;
  fallback: string;
  onChange: (v: string | null) => void;
}) {
  const active = value ?? "";
  // <input type=color> only accepts #RRGGBB; use it as an aid.
  const hexForPicker = /^#[0-9a-fA-F]{6}$/.test(active) ? active : "#000000";
  return (
    <div className="mt-2">
      <Label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-8 w-8 shrink-0 rounded border-2 border-ink/40"
          style={{ background: value ?? fallback }}
          aria-hidden
        />
        <input
          type="color"
          value={hexForPicker}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 shrink-0 cursor-pointer rounded border-2 border-ink/20 bg-transparent p-0"
          aria-label={`${label} picker`}
        />
        <Input
          value={active}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
          placeholder={`Default (${fallback})`}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
          disabled={value === null}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-bold uppercase tracking-widest">{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StringList({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it} onChange={(e) => { const arr = [...items]; arr[i] = e.target.value; onChange(arr); }} placeholder={placeholder} />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}><Plus className="mr-2 h-4 w-4" /> Add</Button>
    </div>
  );
}

function LinkList({ items, onChange }: { items: { label: string; href: string }[]; onChange: (items: { label: string; href: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it.label} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], label: e.target.value }; onChange(arr); }} placeholder="Label" />
          <Input value={it.href} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], href: e.target.value }; onChange(arr); }} placeholder="/path" />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { label: "New", href: "/" }])}><Plus className="mr-2 h-4 w-4" /> Add link</Button>
    </div>
  );
}

export function sectionLabel(s: ThemeHomeSection): string {
  const fallback: Record<string, string> = {
    categories: "Explore by category",
    featured: "Popular designs",
    how: "How it works",
    testimonials: "Testimonials",
    banner: "Banner",
  };
  return (s as any).title?.trim() || fallback[s.type] || s.type;
}

/** Section list with enable/disable, reorder, and (optionally) drill-in. */
export function SectionsEditor({
  sections,
  onChange,
  onSelect,
}: {
  sections: ThemeHomeSection[];
  onChange: (s: ThemeHomeSection[]) => void;
  onSelect?: (id: string) => void;
}) {
  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= sections.length) return;
    const arr = [...sections];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded border-2 border-ink/20 bg-cream p-2">
          <div className="flex min-w-0 items-center gap-2">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => onSelect?.(s.id)}
              disabled={!onSelect}
            >
              <div className="truncate text-sm font-semibold">{sectionLabel(s)}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.type}</div>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={s.enabled ? `Hide ${sectionLabel(s)}` : `Show ${sectionLabel(s)}`}
              onClick={() => { const arr = [...sections]; arr[i] = { ...arr[i], enabled: !arr[i].enabled }; onChange(arr); }}
            >
              {s.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            {onSelect && (
              <Button variant="ghost" size="icon" aria-label={`Edit ${sectionLabel(s)}`} onClick={() => onSelect(s.id)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThemeAnnouncementEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show announcement bar</Label>
        <Switch checked={theme.announcement.enabled} onCheckedChange={(v) => update((t) => ({ ...t, announcement: { ...t.announcement, enabled: v } }))} />
      </div>
      <Field label="Message"><Input value={theme.announcement.text} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, text: e.target.value } }))} /></Field>
      <Field label="Link (optional)"><Input value={theme.announcement.link ?? ""} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, link: e.target.value } }))} /></Field>
    </div>
  );
}

export function ThemeHeroEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-3">
      <Field label="Eyebrow"><Input value={theme.home.hero.eyebrow} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, eyebrow: e.target.value } } }))} /></Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Headline line 1">
          <Input value={theme.home.hero.headlineA} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineA: e.target.value } } }))} />
          <ColorField
            label="Headline Line 1 Colour"
            value={theme.home.hero.headlineAColor}
            fallback={theme.tokens.colors.foreground}
            onChange={(v) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineAColor: v } } }))}
          />
        </Field>
        <Field label="Highlight 1">
          <Input value={theme.home.hero.headlineHighlightA} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightA: e.target.value } } }))} />
          <ColorField
            label="Highlight 1 Colour"
            value={theme.home.hero.headlineHighlightAColor}
            fallback={theme.tokens.colors.accent}
            onChange={(v) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightAColor: v } } }))}
          />
        </Field>
        <Field label="Headline line 2">
          <Input value={theme.home.hero.headlineB} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineB: e.target.value } } }))} />
          <ColorField
            label="Headline Line 2 Colour"
            value={theme.home.hero.headlineBColor}
            fallback={theme.tokens.colors.foreground}
            onChange={(v) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineBColor: v } } }))}
          />
        </Field>
        <Field label="Highlight 2">
          <Input value={theme.home.hero.headlineHighlightB} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightB: e.target.value } } }))} />
          <ColorField
            label="Highlight 2 Colour"
            value={theme.home.hero.headlineHighlightBColor}
            fallback={theme.tokens.colors.secondary}
            onChange={(v) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightBColor: v } } }))}
          />
        </Field>
      </div>
      <Field label="Body"><Textarea value={theme.home.hero.body} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, body: e.target.value } } }))} /></Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Primary CTA label"><Input value={theme.home.hero.ctaPrimaryLabel} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaPrimaryLabel: e.target.value } } }))} /></Field>
        <Field label="Primary CTA link"><Input value={theme.home.hero.ctaPrimaryHref} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaPrimaryHref: e.target.value } } }))} /></Field>
        <Field label="Secondary CTA label"><Input value={theme.home.hero.ctaSecondaryLabel} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaSecondaryLabel: e.target.value } } }))} /></Field>
        <Field label="Secondary CTA link"><Input value={theme.home.hero.ctaSecondaryHref} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaSecondaryHref: e.target.value } } }))} /></Field>
      </div>
      <Field label="Hero image">
        <MediaPicker
          value={theme.home.hero.imageAssetId ? { assetId: theme.home.hero.imageAssetId, url: theme.home.hero.imageUrl ?? "", alt: null, width: null, height: null } : null}
          onChange={(v) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, imageAssetId: v?.assetId ?? null, imageUrl: v?.url ?? t.home.hero.imageUrl } } }))}
        />
      </Field>
    </div>
  );
}

export function ThemeMarqueeEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Enabled</Label>
        <Switch checked={theme.home.marquee.enabled} onCheckedChange={(v) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, enabled: v } } }))} />
      </div>
      <StringList items={theme.home.marquee.items} onChange={(items) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, items } } }))} placeholder="Ships in 48h" />
    </div>
  );
}

/** Settings for one homepage section. */
export function ThemeSectionSettingsEditor({
  theme,
  sectionId,
  update,
}: {
  theme: Theme;
  sectionId: string;
  update: Updater;
}) {
  const index = theme.home.sections.findIndex((s) => s.id === sectionId);
  const section = index >= 0 ? theme.home.sections[index] : null;
  if (!section) return <p className="text-sm text-muted-foreground">Section not found.</p>;

  const patch = (fields: Record<string, unknown>) =>
    update((t) => {
      const arr = [...t.home.sections];
      arr[index] = { ...(arr[index] as any), ...fields } as ThemeHomeSection;
      return { ...t, home: { ...t.home, sections: arr } };
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Visible on homepage</Label>
        <Switch checked={section.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
      </div>
      <Field label="Title">
        <Input value={(section as any).title ?? ""} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      {"eyebrow" in section && (
        <Field label="Eyebrow">
          <Input value={(section as any).eyebrow ?? ""} onChange={(e) => patch({ eyebrow: e.target.value })} />
        </Field>
      )}
      {section.type === "banner" && (
        <>
          <Field label="Body"><Textarea value={(section as any).body ?? ""} onChange={(e) => patch({ body: e.target.value })} /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="CTA label"><Input value={(section as any).ctaLabel ?? ""} onChange={(e) => patch({ ctaLabel: e.target.value })} /></Field>
            <Field label="CTA link"><Input value={(section as any).ctaHref ?? ""} onChange={(e) => patch({ ctaHref: e.target.value })} /></Field>
          </div>
        </>
      )}
      {section.type === "testimonials" && (
        <p className="rounded border-2 border-ink/20 bg-yellow/30 p-3 text-xs">
          Testimonial entries are managed with the section's items list in the theme draft.
        </p>
      )}
    </div>
  );
}

export function ThemePagesEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-6">
      <Section title="Shop page banner">
        <Field label="Title"><Input value={theme.pages.shop.banner.title} onChange={(e) => update((t) => ({ ...t, pages: { ...t.pages, shop: { banner: { ...t.pages.shop.banner, title: e.target.value } } } }))} /></Field>
        <Field label="Body"><Textarea value={theme.pages.shop.banner.body} onChange={(e) => update((t) => ({ ...t, pages: { ...t.pages, shop: { banner: { ...t.pages.shop.banner, body: e.target.value } } } }))} /></Field>
      </Section>
      <Section title="Product page trust badges">
        <StringList items={theme.pages.product.trustBadges} onChange={(items) => update((t) => ({ ...t, pages: { ...t.pages, product: { trustBadges: items } } }))} placeholder="48h turnaround" />
      </Section>
      <Section title="About page blocks">
        {theme.pages.about.blocks.map((b, i) => (
          <div key={i} className="rounded border-2 border-ink/20 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Input value={b.heading} onChange={(e) => update((t) => { const arr = [...t.pages.about.blocks]; arr[i] = { ...arr[i], heading: e.target.value }; return { ...t, pages: { ...t.pages, about: { blocks: arr } } }; })} placeholder="Heading" />
              <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, pages: { ...t.pages, about: { blocks: t.pages.about.blocks.filter((_, x) => x !== i) } } }))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea value={b.body} onChange={(e) => update((t) => { const arr = [...t.pages.about.blocks]; arr[i] = { ...arr[i], body: e.target.value }; return { ...t, pages: { ...t.pages, about: { blocks: arr } } }; })} placeholder="Body copy…" />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => update((t) => ({ ...t, pages: { ...t.pages, about: { blocks: [...t.pages.about.blocks, { heading: "", body: "" }] } } }))}><Plus className="mr-2 h-4 w-4" /> Add block</Button>
      </Section>
    </div>
  );
}

export function ThemeInventoryEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-4">
      <Field label="Low stock threshold">
        <Input type="number" min={0} value={theme.inventory.lowStockThreshold} onChange={(e) => update((t) => ({ ...t, inventory: { lowStockThreshold: Number(e.target.value) || 0 } }))} />
      </Field>
      <p className="text-xs text-muted-foreground">Variants at or below this stock level are flagged as low stock.</p>
    </div>
  );
}

export function ThemeCommerceEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <div className="space-y-4">
      <Field label="Storefront currency">
        <select
          value={theme.commerce.currency}
          onChange={(e) => update((t) => ({ ...t, commerce: { currency: e.target.value as any } }))}
          className="w-full rounded border-2 border-ink bg-cream px-3 py-2 text-sm font-semibold"
        >
          {SUPPORTED_CURRENCY_CODES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <p className="text-xs text-muted-foreground">
        Sets the currency shown across the storefront (gang sheet builder, quote requests, and pricing controls).
        Amounts are entered directly in this currency — no automatic conversion. Update your pricing rules in
        Craft OS → Gang Sheet Pricing after changing this.
      </p>
    </div>
  );
}

