import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import {
  adminGetTheme,
  adminSaveThemeDraft,
  adminPublishTheme,
  adminListThemeVersions,
  adminRevertThemeVersion,
} from "@/lib/theme.functions";
import { mergeTheme, type Theme, type ThemeHomeSection } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, Save, Rocket, Trash2, Plus, ArrowUp, ArrowDown, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/theme")({
  ssr: false,
  head: () => ({ meta: [{ title: "Theme editor — Craft Studio" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) {
      throw redirect({ to: "/portal-admin" });
    }
  },
  component: ThemeEditor,
});

function ThemeEditor() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetTheme);
  const saveFn = useServerFn(adminSaveThemeDraft);
  const publishFn = useServerFn(adminPublishTheme);
  const versionsFn = useServerFn(adminListThemeVersions);
  const revertFn = useServerFn(adminRevertThemeVersion);

  const { data: row } = useQuery({ queryKey: ["theme:admin"], queryFn: () => getFn() });
  const { data: versions = [] } = useQuery({ queryKey: ["theme:versions"], queryFn: () => versionsFn() });

  const [draft, setDraft] = useState<Theme | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (row && !draft) setDraft(mergeTheme(row.draft));
  }, [row, draft]);

  if (!draft) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const update = (fn: (t: Theme) => Theme) => { setDraft(fn(draft)); setDirty(true); };

  const save = async () => {
    await saveFn({ data: { draft } });
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["theme:admin"] });
    qc.invalidateQueries({ queryKey: ["theme:draft"] });
    toast.success("Draft saved");
  };

  const publish = async () => {
    if (dirty) await saveFn({ data: { draft } });
    await publishFn({ data: {} });
    setDirty(false);
    qc.invalidateQueries();
    toast.success("Published live 🎉");
  };

  const revert = async (versionId: string) => {
    await revertFn({ data: { versionId } });
    const fresh = await getFn();
    setDraft(mergeTheme(fresh.draft));
    setDirty(false);
    qc.invalidateQueries();
    toast.success("Loaded version into draft");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">Theme editor</h1>
          <p className="text-sm text-muted-foreground">
            Edit the live storefront. Save draft → preview → publish.
            {dirty && <span className="ml-2 rounded bg-yellow px-2 py-0.5 text-xs font-bold uppercase tracking-widest">Unsaved</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={save} disabled={!dirty}><Save className="mr-2 h-4 w-4" /> Save draft</Button>
          <a href="/?theme=draft" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-4 py-2 text-sm font-bold hover:bg-yellow">
            <ExternalLink className="h-4 w-4" /> Preview
          </a>
          {isOwner && (
            <Button onClick={publish} className="bg-magenta text-cream hover:bg-magenta/90"><Rocket className="mr-2 h-4 w-4" /> Publish</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="rounded-lg border-2 border-ink bg-cream p-4">
          <Tabs defaultValue="brand">
            <TabsList className="mb-4 flex w-full flex-wrap gap-1 bg-ink/5">
              <TabsTrigger value="brand">Brand</TabsTrigger>
              <TabsTrigger value="announcement">Announcement</TabsTrigger>
              <TabsTrigger value="home">Homepage</TabsTrigger>
              <TabsTrigger value="nav">Navigation</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="brand" className="space-y-4">
              <Field label="Business name">
                <Input value={draft.brand.name} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, name: e.target.value } }))} />
              </Field>
              <Field label="Tagline">
                <Input value={draft.brand.tagline} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, tagline: e.target.value } }))} />
              </Field>
              <Field label="Logo URL (optional — leave blank for text)">
                <Input value={draft.brand.logoUrl ?? ""} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, logoUrl: e.target.value || null } }))} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Primary color">
                  <Input type="color" value={draft.brand.primary} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, primary: e.target.value } }))} />
                </Field>
                <Field label="Accent color">
                  <Input type="color" value={draft.brand.accent} onChange={(e) => update((t) => ({ ...t, brand: { ...t.brand, accent: e.target.value } }))} />
                </Field>
              </div>
            </TabsContent>

            <TabsContent value="announcement" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show announcement bar</Label>
                <Switch checked={draft.announcement.enabled} onCheckedChange={(v) => update((t) => ({ ...t, announcement: { ...t.announcement, enabled: v } }))} />
              </div>
              <Field label="Message">
                <Input value={draft.announcement.text} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, text: e.target.value } }))} />
              </Field>
              <Field label="Link (optional)">
                <Input value={draft.announcement.link ?? ""} onChange={(e) => update((t) => ({ ...t, announcement: { ...t.announcement, link: e.target.value } }))} />
              </Field>
            </TabsContent>

            <TabsContent value="home" className="space-y-6">
              <Section title="Hero">
                <Field label="Eyebrow">
                  <Input value={draft.home.hero.eyebrow} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, eyebrow: e.target.value } } }))} />
                </Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Headline line 1"><Input value={draft.home.hero.headlineA} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineA: e.target.value } } }))} /></Field>
                  <Field label="Highlight 1"><Input value={draft.home.hero.headlineHighlightA} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightA: e.target.value } } }))} /></Field>
                  <Field label="Headline line 2"><Input value={draft.home.hero.headlineB} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineB: e.target.value } } }))} /></Field>
                  <Field label="Highlight 2"><Input value={draft.home.hero.headlineHighlightB} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, headlineHighlightB: e.target.value } } }))} /></Field>
                </div>
                <Field label="Body"><Textarea value={draft.home.hero.body} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, body: e.target.value } } }))} /></Field>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Primary CTA label"><Input value={draft.home.hero.ctaPrimaryLabel} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaPrimaryLabel: e.target.value } } }))} /></Field>
                  <Field label="Primary CTA link"><Input value={draft.home.hero.ctaPrimaryHref} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaPrimaryHref: e.target.value } } }))} /></Field>
                  <Field label="Secondary CTA label"><Input value={draft.home.hero.ctaSecondaryLabel} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaSecondaryLabel: e.target.value } } }))} /></Field>
                  <Field label="Secondary CTA link"><Input value={draft.home.hero.ctaSecondaryHref} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, ctaSecondaryHref: e.target.value } } }))} /></Field>
                </div>
                <Field label="Hero image URL (optional)"><Input value={draft.home.hero.imageUrl ?? ""} onChange={(e) => update((t) => ({ ...t, home: { ...t.home, hero: { ...t.home.hero, imageUrl: e.target.value || null } } }))} /></Field>
              </Section>

              <Section title="Marquee ticker">
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch checked={draft.home.marquee.enabled} onCheckedChange={(v) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, enabled: v } } }))} />
                </div>
                <StringList
                  items={draft.home.marquee.items}
                  onChange={(items) => update((t) => ({ ...t, home: { ...t.home, marquee: { ...t.home.marquee, items } } }))}
                  placeholder="Ships in 48h"
                />
              </Section>

              <Section title="Sections (drag to reorder)">
                <SectionsEditor
                  sections={draft.home.sections}
                  onChange={(sections) => update((t) => ({ ...t, home: { ...t.home, sections } }))}
                />
              </Section>
            </TabsContent>

            <TabsContent value="nav" className="space-y-3">
              <LinkList
                items={draft.nav.items}
                onChange={(items) => update((t) => ({ ...t, nav: { items } }))}
              />
            </TabsContent>

            <TabsContent value="footer" className="space-y-6">
              <Field label="Blurb"><Textarea value={draft.footer.blurb} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, blurb: e.target.value } }))} /></Field>
              <Field label="Contact email"><Input value={draft.footer.contactEmail ?? ""} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, contactEmail: e.target.value } }))} /></Field>
              <Field label="Legal text"><Input value={draft.footer.legal ?? ""} onChange={(e) => update((t) => ({ ...t, footer: { ...t.footer, legal: e.target.value } }))} /></Field>

              <Section title="Columns">
                {draft.footer.columns.map((col, ci) => (
                  <div key={ci} className="rounded border-2 border-ink/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Input value={col.title} onChange={(e) => update((t) => { const c = [...t.footer.columns]; c[ci] = { ...c[ci], title: e.target.value }; return { ...t, footer: { ...t.footer, columns: c } }; })} />
                      <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, columns: t.footer.columns.filter((_, i) => i !== ci) } }))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <LinkList items={col.links} onChange={(links) => update((t) => { const c = [...t.footer.columns]; c[ci] = { ...c[ci], links }; return { ...t, footer: { ...t.footer, columns: c } }; })} />
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, columns: [...t.footer.columns, { title: "New column", links: [] }] } }))}><Plus className="mr-2 h-4 w-4" /> Add column</Button>
              </Section>

              <Section title="Social links">
                {draft.footer.socials.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={s.kind} onChange={(e) => update((t) => { const arr = [...t.footer.socials]; arr[i] = { ...arr[i], kind: e.target.value as any }; return { ...t, footer: { ...t.footer, socials: arr } }; })} className="rounded border-2 border-ink bg-cream px-2 py-1 text-sm">
                      {["instagram", "tiktok", "twitter", "facebook", "email"].map((k) => <option key={k}>{k}</option>)}
                    </select>
                    <Input value={s.href} onChange={(e) => update((t) => { const arr = [...t.footer.socials]; arr[i] = { ...arr[i], href: e.target.value }; return { ...t, footer: { ...t.footer, socials: arr } }; })} />
                    <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, socials: t.footer.socials.filter((_, x) => x !== i) } }))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((t) => ({ ...t, footer: { ...t.footer, socials: [...t.footer.socials, { kind: "instagram", href: "" }] } }))}><Plus className="mr-2 h-4 w-4" /> Add social</Button>
              </Section>
            </TabsContent>

            <TabsContent value="pages" className="space-y-6">
              <Section title="Shop page banner">
                <Field label="Title"><Input value={draft.pages.shop.banner.title} onChange={(e) => update((t) => ({ ...t, pages: { ...t.pages, shop: { banner: { ...t.pages.shop.banner, title: e.target.value } } } }))} /></Field>
                <Field label="Body"><Textarea value={draft.pages.shop.banner.body} onChange={(e) => update((t) => ({ ...t, pages: { ...t.pages, shop: { banner: { ...t.pages.shop.banner, body: e.target.value } } } }))} /></Field>
              </Section>
              <Section title="Product page trust badges">
                <StringList items={draft.pages.product.trustBadges} onChange={(items) => update((t) => ({ ...t, pages: { ...t.pages, product: { trustBadges: items } } }))} placeholder="48h turnaround" />
              </Section>
              <Section title="About page blocks">
                {draft.pages.about.blocks.map((b, i) => (
                  <div key={i} className="rounded border-2 border-ink/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Input value={b.heading} onChange={(e) => update((t) => { const arr = [...t.pages.about.blocks]; arr[i] = { ...arr[i], heading: e.target.value }; return { ...t, pages: { ...t.pages, about: { blocks: arr } } }; })} placeholder="Heading" />
                      <Button variant="ghost" size="icon" onClick={() => update((t) => ({ ...t, pages: { ...t.pages, about: { blocks: t.pages.about.blocks.filter((_, x) => x !== i) } } }))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Textarea value={b.body} onChange={(e) => update((t) => { const arr = [...t.pages.about.blocks]; arr[i] = { ...arr[i], body: e.target.value }; return { ...t, pages: { ...t.pages, about: { blocks: arr } } }; })} placeholder="Body copy…" />
                  </div>
                ))}
                <Button variant="outline" onClick={() => update((t) => ({ ...t, pages: { ...t.pages, about: { blocks: [...t.pages.about.blocks, { heading: "", body: "" }] } } }))}><Plus className="mr-2 h-4 w-4" /> Add block</Button>
              </Section>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <Field label="Low stock threshold">
                <Input type="number" min={0} value={draft.inventory.lowStockThreshold} onChange={(e) => update((t) => ({ ...t, inventory: { lowStockThreshold: Number(e.target.value) || 0 } }))} />
              </Field>
              <p className="text-xs text-muted-foreground">Variants at or below this stock level are flagged as low stock on the dashboard.</p>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="h-fit rounded-lg border-2 border-ink bg-cream p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <History className="h-4 w-4" /> Version history
          </div>
          {versions.length === 0 && <p className="text-xs text-muted-foreground">No previous versions yet. Publishing snapshots the current live theme here first.</p>}
          <ul className="space-y-2">
            {versions.map((v: any) => (
              <li key={v.id} className="rounded border-2 border-ink/20 p-2 text-xs">
                <div className="font-semibold">{v.label ?? "Snapshot"}</div>
                <div className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                {isOwner && (
                  <button className="mt-1 text-magenta hover:underline" onClick={() => revert(v.id)}>Load into draft</button>
                )}
              </li>
            ))}
          </ul>
        </aside>
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
    <div className="space-y-3 rounded-lg border-2 border-ink/10 bg-white/50 p-4">
      <div className="text-sm font-bold uppercase tracking-widest">{title}</div>
      {children}
    </div>
  );
}

function StringList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it} onChange={(e) => { const arr = [...items]; arr[i] = e.target.value; onChange(arr); }} placeholder={placeholder} />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, ""])}><Plus className="mr-2 h-3 w-3" /> Add</Button>
    </div>
  );
}

function LinkList({ items, onChange }: { items: { label: string; href: string }[]; onChange: (v: { label: string; href: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it.label} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], label: e.target.value }; onChange(arr); }} placeholder="Label" />
          <Input value={it.href} onChange={(e) => { const arr = [...items]; arr[i] = { ...arr[i], href: e.target.value }; onChange(arr); }} placeholder="/link" />
          <Button variant="ghost" size="icon" onClick={() => onChange(items.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { label: "", href: "" }])}><Plus className="mr-2 h-3 w-3" /> Add link</Button>
    </div>
  );
}

function SectionsEditor({ sections, onChange }: { sections: ThemeHomeSection[]; onChange: (s: ThemeHomeSection[]) => void }) {
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...sections];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  };
  const patch = (i: number, p: any) => { const arr = [...sections]; arr[i] = { ...arr[i], ...p }; onChange(arr); };
  const add = (type: ThemeHomeSection["type"]) => {
    const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    const base: any = { id, type, enabled: true, title: "" };
    if (type === "testimonials") base.items = [];
    if (type === "banner") { base.body = ""; base.ctaLabel = "Shop"; base.ctaHref = "/shop"; base.bg = "bg-yellow"; }
    onChange([...sections, base]);
  };

  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={s.id} className="rounded border-2 border-ink/20 bg-white p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold uppercase text-cream">{s.type}</span>
            <Input value={(s as any).title ?? ""} onChange={(e) => patch(i, { title: e.target.value })} placeholder="Title" />
            <Switch checked={s.enabled} onCheckedChange={(v) => patch(i, { enabled: v })} />
            <Button variant="ghost" size="icon" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onChange(sections.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          {(s.type === "featured" || s.type === "how") && (
            <Input value={(s as any).eyebrow ?? ""} onChange={(e) => patch(i, { eyebrow: e.target.value })} placeholder="Eyebrow" />
          )}
          {s.type === "testimonials" && (
            <div className="space-y-2">
              {(s.items ?? []).map((t, ti) => (
                <div key={ti} className="rounded border p-2">
                  <Textarea value={t.quote} onChange={(e) => { const items = [...(s.items ?? [])]; items[ti] = { ...items[ti], quote: e.target.value }; patch(i, { items }); }} placeholder="Quote" />
                  <div className="mt-1 flex gap-2">
                    <Input value={t.author} onChange={(e) => { const items = [...(s.items ?? [])]; items[ti] = { ...items[ti], author: e.target.value }; patch(i, { items }); }} placeholder="Author" />
                    <Button variant="ghost" size="icon" onClick={() => patch(i, { items: (s.items ?? []).filter((_, x) => x !== ti) })}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => patch(i, { items: [...(s.items ?? []), { quote: "", author: "" }] })}><Plus className="mr-2 h-3 w-3" /> Add testimonial</Button>
            </div>
          )}
          {s.type === "banner" && (
            <div className="mt-2 space-y-2">
              <Textarea value={(s as any).body ?? ""} onChange={(e) => patch(i, { body: e.target.value })} placeholder="Body" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={(s as any).ctaLabel ?? ""} onChange={(e) => patch(i, { ctaLabel: e.target.value })} placeholder="CTA label" />
                <Input value={(s as any).ctaHref ?? ""} onChange={(e) => patch(i, { ctaHref: e.target.value })} placeholder="CTA link" />
              </div>
              <select value={(s as any).bg ?? "bg-yellow"} onChange={(e) => patch(i, { bg: e.target.value })} className="rounded border-2 border-ink bg-cream px-2 py-1 text-sm">
                {["bg-yellow", "bg-cyan", "bg-magenta text-cream", "bg-ink text-cream"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {(["categories", "featured", "how", "testimonials", "banner"] as const).map((t) => (
          <Button key={t} variant="outline" size="sm" onClick={() => add(t)}><Plus className="mr-1 h-3 w-3" /> Add {t}</Button>
        ))}
      </div>
    </div>
  );
}
