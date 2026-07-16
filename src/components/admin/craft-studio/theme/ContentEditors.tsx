// Preserves the existing announcement / homepage / navigation / footer /
// pages / inventory editors from the original theme.tsx, refactored out
// of the giant route component. These will be replaced by dedicated
// Craft Studio modules in later engineering tasks (004E+).

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { MediaPicker } from "@/components/admin/craft-studio/MediaPicker";
import type { Theme, ThemeHomeSection } from "@/lib/theme";
import { SUPPORTED_CURRENCY_CODES } from "@/lib/theme";

type Updater = (fn: (t: Theme) => Theme) => void;

function ColorField({
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

function SectionsEditor({ sections, onChange }: { sections: ThemeHomeSection[]; onChange: (s: ThemeHomeSection[]) => void }) {
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
        <div key={s.id} className="flex items-center justify-between gap-2 rounded border-2 border-ink/20 bg-cream p-3">
          <div className="flex items-center gap-3">
            <Switch checked={s.enabled} onCheckedChange={(v) => { const arr = [...sections]; arr[i] = { ...arr[i], enabled: v }; onChange(arr); }} />
            <div>
              <div className="text-sm font-semibold capitalize">{s.type}</div>
              <div className="text-xs text-muted-foreground">{(s as any).title ?? ""}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThemeContentEditor({ theme, update }: { theme: Theme; update: Updater }) {
  return (
    <Tabs defaultValue="announcement" className="w-full">
      <TabsList className="mb-4 flex w-full flex-wrap gap-1 bg-ink/5">
        <TabsTrigger value="announcement">Announcement</TabsTrigger>
        <TabsTrigger value="home">Homepage</TabsTrigger>
        <TabsTrigger value="nav">Navigation</TabsTrigger>
        <TabsTrigger value="footer">Footer</TabsTrigger>
        <TabsTrigger value="pages">Pages</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="commerce">Commerce</TabsTrigger>
      </TabsList>

      <TabsContent value="announcement" className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Show announcement bar</Label>
          <Switch checked={theme.announcement.enabled} onCheckedChange={(v) => update((t) => ({ ...t, announcement: { ...t.announcement, enabled: v } }))} />
        </div>
        <Field label="Message"><Input value={theme.announcement.text} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, text: e.target.value } }))} /></Field>
        <Field label="Link (optional)"><Input value={theme.announcement.link ?? ""} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, link: e.target.value } }))} /></Field>
      </TabsContent>

      <TabsContent value="home" className="space-y-6">
        <Section title="Hero">
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
        </Section>

        <Section title="Marquee ticker">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={theme.home.marquee.enabled} onCheckedChange={(v) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, enabled: v } } }))} />
          </div>
          <StringList items={theme.home.marquee.items} onChange={(items) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, items } } }))} placeholder="Ships in 48h" />
        </Section>

        <Section title="Sections (reorder)">
          <SectionsEditor sections={theme.home.sections} onChange={(sections) => update((t) => ({ ...t, home: { ...t.home, sections } }))} />
        </Section>
      </TabsContent>

      <TabsContent value="nav">
        <LinkList items={theme.nav.items} onChange={(items) => update((t) => ({ ...t, nav: { items } }))} />
      </TabsContent>

      <TabsContent value="footer" className="space-y-6">
        <Field label="Blurb"><Textarea value={theme.footer.blurb} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, blurb: e.target.value } }))} /></Field>
        <Field label="Contact email"><Input value={theme.footer.contactEmail ?? ""} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, contactEmail: e.target.value } }))} /></Field>
        <Field label="Legal text"><Input value={theme.footer.legal ?? ""} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, legal: e.target.value } }))} /></Field>

        <Section title="Columns">
          {theme.footer.columns.map((col, ci) => (
            <div key={ci} className="rounded border-2 border-ink/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Input value={col.title} onChange={(e) => update((t) => { const c = [...t.footer.columns]; c[ci] = { ...c[ci], title: e.target.value }; return { ...t, footer: { ...t.footer, columns: c } }; })} />
                <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, columns: t.footer.columns.filter((_, i) => i !== ci) } }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <LinkList items={col.links} onChange={(links) => update((t) => { const c = [...t.footer.columns]; c[ci] = { ...c[ci], links }; return { ...t, footer: { ...t.footer, columns: c } }; })} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, columns: [...t.footer.columns, { title: "New column", links: [] }] } }))}><Plus className="mr-2 h-4 w-4" /> Add column</Button>
        </Section>

        <Section title="Social links">
          {theme.footer.socials.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={s.kind} onChange={(e) => update((t) => { const arr = [...t.footer.socials]; arr[i] = { ...arr[i], kind: e.target.value as any }; return { ...t, footer: { ...t.footer, socials: arr } }; })} className="rounded border-2 border-ink bg-cream px-2 py-1 text-sm">
                {["instagram", "tiktok", "twitter", "facebook", "email"].map((k) => <option key={k}>{k}</option>)}
              </select>
              <Input value={s.href} onChange={(e) => update((t) => { const arr = [...t.footer.socials]; arr[i] = { ...arr[i], href: e.target.value }; return { ...t, footer: { ...t.footer, socials: arr } }; })} />
              <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, socials: t.footer.socials.filter((_, x) => x !== i) } }))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, socials: [...t.footer.socials, { kind: "instagram", href: "" }] } }))}><Plus className="mr-2 h-4 w-4" /> Add social</Button>
        </Section>
      </TabsContent>

      <TabsContent value="pages" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="inventory" className="space-y-4">
        <Field label="Low stock threshold">
          <Input type="number" min={0} value={theme.inventory.lowStockThreshold} onChange={(e) => update((t) => ({ ...t, inventory: { lowStockThreshold: Number(e.target.value) || 0 } }))} />
        </Field>
        <p className="text-xs text-muted-foreground">Variants at or below this stock level are flagged as low stock.</p>
      </TabsContent>

      <TabsContent value="commerce" className="space-y-4">
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
      </TabsContent>
    </Tabs>
  );
}