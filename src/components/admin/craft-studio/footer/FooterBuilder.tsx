import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/admin/craft-studio/MediaPicker";

import type { FooterColumnV2, SocialLink, StorefrontFooter } from "@/lib/theme";
import { FOOTER_LIMITS, SOCIAL_PLATFORMS, isSafeExternalUrl, newId } from "@/lib/storefront/site-config";

import { useThemeDraft } from "../site-editor/useThemeDraft";
import { BuilderHeader } from "../site-editor/BuilderHeader";
import { FooterColumnEditor } from "./FooterColumnEditor";
import { FooterPreview } from "./FooterPreview";

export function FooterBuilder() {
  const { draft, dirty, busy, isLoading, error, update, save, publish } = useThemeDraft();

  if (isLoading || !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading footer…
      </div>
    );
  }
  if (error) return <div className="text-sm text-destructive">Failed to load theme.</div>;

  const footer = draft.footerV2;
  const setFooter = (fn: (f: StorefrontFooter) => StorefrontFooter) =>
    update((t) => ({ ...t, footerV2: fn(t.footerV2) }));

  const setColumns = (columns: FooterColumnV2[]) => setFooter((f) => ({ ...f, columns }));
  const setSocials = (socialLinks: SocialLink[]) => setFooter((f) => ({ ...f, socialLinks }));

  return (
    <div>
      <BuilderHeader
        title="Footer Builder"
        subtitle="Craft Studio · Footer content and links"
        dirty={dirty}
        busy={busy}
        onSave={save}
        onPublish={publish}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Brand */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Brand</h2>
              <label className="inline-flex items-center gap-2 text-xs">
                <Switch checked={footer.enabled} onCheckedChange={(v) => setFooter((f) => ({ ...f, enabled: !!v }))} />
                Footer enabled
              </label>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest">Business name</Label>
                <Input
                  value={footer.businessName}
                  maxLength={FOOTER_LIMITS.maxBusinessNameLen}
                  onChange={(e) => setFooter((f) => ({ ...f, businessName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest">Description</Label>
                <Textarea
                  value={footer.description}
                  maxLength={FOOTER_LIMITS.maxDescriptionLen}
                  onChange={(e) => setFooter((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest">Logo</Label>
                <MediaPicker
                  value={footer.logoAssetId ? { assetId: footer.logoAssetId, url: footer.logoUrl ?? "", alt: null, width: null, height: null } : null}
                  onChange={(v) => setFooter((f) => ({ ...f, logoAssetId: v?.assetId ?? null, logoUrl: v?.url ?? null }))}
                />
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Columns</h2>
                <p className="text-xs text-muted-foreground">
                  {footer.columns.length} / {FOOTER_LIMITS.maxColumns} columns.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setColumns([...footer.columns, { id: newId("c"), heading: "New column", enabled: true, links: [] }])}
                disabled={footer.columns.length >= FOOTER_LIMITS.maxColumns}
              >
                <Plus className="mr-1 h-4 w-4" /> Add column
              </Button>
            </div>
            {footer.columns.length === 0 ? (
              <div className="rounded border border-dashed border-ink/30 p-6 text-center text-sm text-muted-foreground">
                No columns yet.
              </div>
            ) : (
              <div className="space-y-2">
                {footer.columns.map((c, i) => (
                  <FooterColumnEditor
                    key={c.id}
                    column={c}
                    index={i}
                    total={footer.columns.length}
                    onChange={(next) => setColumns(footer.columns.map((x, xi) => (xi === i ? next : x)))}
                    onDelete={() => setColumns(footer.columns.filter((_, xi) => xi !== i))}
                    onDuplicate={() => setColumns([...footer.columns.slice(0, i + 1), { ...c, id: newId("c") }, ...footer.columns.slice(i + 1)])}
                    onMove={(dir) => {
                      const arr = [...footer.columns];
                      const j = i + dir;
                      if (j < 0 || j >= arr.length) return;
                      [arr[i], arr[j]] = [arr[j], arr[i]];
                      setColumns(arr);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Contact</h2>
              <label className="inline-flex items-center gap-2 text-xs">
                <Switch checked={footer.contact.enabled} onCheckedChange={(v) => setFooter((f) => ({ ...f, contact: { ...f.contact, enabled: !!v } }))} />
                Show contact
              </label>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Email"
                value={footer.contact.email}
                onChange={(e) => setFooter((f) => ({ ...f, contact: { ...f.contact, email: e.target.value } }))}
                maxLength={FOOTER_LIMITS.maxContactLen}
              />
              <Input
                placeholder="Phone"
                value={footer.contact.phone}
                onChange={(e) => setFooter((f) => ({ ...f, contact: { ...f.contact, phone: e.target.value } }))}
                maxLength={FOOTER_LIMITS.maxContactLen}
              />
              <Textarea
                placeholder="Address"
                value={footer.contact.address}
                onChange={(e) => setFooter((f) => ({ ...f, contact: { ...f.contact, address: e.target.value } }))}
                maxLength={FOOTER_LIMITS.maxContactLen}
                rows={2}
              />
            </div>
          </div>

          {/* Socials */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Social links</h2>
              <Button
                size="sm"
                onClick={() =>
                  setSocials([
                    ...footer.socialLinks,
                    { id: newId("s"), platform: "instagram", label: "Instagram", url: "https://", enabled: true },
                  ])
                }
                disabled={footer.socialLinks.length >= FOOTER_LIMITS.maxSocials}
              >
                <Plus className="mr-1 h-4 w-4" /> Add social
              </Button>
            </div>
            <div className="space-y-2">
              {footer.socialLinks.map((s, i) => {
                const valid = isSafeExternalUrl(s.url);
                return (
                  <div key={s.id} className="rounded border border-ink/10 bg-white p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={s.platform} onValueChange={(v) => setSocials(footer.socialLinks.map((x, xi) => xi === i ? { ...x, platform: v as any } : x))}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Label"
                        value={s.label}
                        onChange={(e) => setSocials(footer.socialLinks.map((x, xi) => xi === i ? { ...x, label: e.target.value } : x))}
                        className="w-32"
                      />
                      <Input
                        placeholder="https://..."
                        value={s.url}
                        onChange={(e) => setSocials(footer.socialLinks.map((x, xi) => xi === i ? { ...x, url: e.target.value } : x))}
                        className={`flex-1 min-w-[160px] ${valid ? "" : "border-destructive"}`}
                      />
                      <Switch checked={s.enabled} onCheckedChange={(v) => setSocials(footer.socialLinks.map((x, xi) => xi === i ? { ...x, enabled: !!v } : x))} />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const arr = [...footer.socialLinks]; const j = i - 1;
                        if (j < 0) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setSocials(arr);
                      }} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const arr = [...footer.socialLinks]; const j = i + 1;
                        if (j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; setSocials(arr);
                      }} disabled={i === footer.socialLinks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setSocials([...footer.socialLinks.slice(0, i+1), { ...s, id: newId("s") }, ...footer.socialLinks.slice(i+1)])}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setSocials(footer.socialLinks.filter((_, xi) => xi !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <h2 className="mb-3 text-lg font-bold">Settings</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest">Copyright text</Label>
                <Input
                  value={footer.copyrightText}
                  maxLength={FOOTER_LIMITS.maxCopyrightLen}
                  onChange={(e) => setFooter((f) => ({ ...f, copyrightText: e.target.value }))}
                  placeholder="© {year} Craft & Cling. All rights reserved."
                />
                <p className="mt-1 text-xs text-muted-foreground">Use <code>{'{year}'}</code> to auto-insert the current year.</p>
              </div>
              <div className="flex items-center justify-between rounded border border-ink/10 bg-white px-3 py-2 text-sm">
                <span>Show "Powered by Craft &amp; Cling"</span>
                <Switch checked={footer.showPoweredBy} onCheckedChange={(v) => setFooter((f) => ({ ...f, showPoweredBy: !!v }))} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <FooterPreview footer={footer} />
        </div>
      </div>
    </div>
  );
}