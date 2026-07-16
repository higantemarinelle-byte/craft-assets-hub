import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NAV_LIMITS, newId } from "@/lib/storefront/site-config";
import type { NavigationLink, StorefrontNavigation } from "@/lib/theme";

import { useThemeDraft } from "../site-editor/useThemeDraft";
import { BuilderHeader } from "../site-editor/BuilderHeader";
import { NavigationItemEditor } from "./NavigationItemEditor";
import { NavigationPreview } from "./NavigationPreview";

export function NavigationBuilder() {
  const { draft, dirty, busy, isLoading, error, update, save, publish } = useThemeDraft();

  if (isLoading || !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading navigation…
      </div>
    );
  }
  if (error) return <div className="text-sm text-destructive">Failed to load theme.</div>;

  const nav = draft.navigation;
  const setNav = (fn: (n: StorefrontNavigation) => StorefrontNavigation) =>
    update((t) => ({ ...t, navigation: fn(t.navigation) }));

  const setLinks = (links: NavigationLink[]) => setNav((n) => ({ ...n, links }));

  const addLink = () =>
    setLinks([
      ...nav.links,
      { id: newId("n"), label: "New link", type: "internal", href: "/", enabled: true, openInNewTab: false, children: [] },
    ]);

  return (
    <div>
      <BuilderHeader
        title="Navigation Builder"
        subtitle="Craft Studio · Header links and controls"
        dirty={dirty}
        busy={busy}
        onSave={save}
        onPublish={publish}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Links */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Menu links</h2>
                <p className="text-xs text-muted-foreground">
                  {nav.links.length} / {NAV_LIMITS.maxTopLevel} top-level links. One level of dropdown children supported.
                </p>
              </div>
              <Button size="sm" onClick={addLink} disabled={nav.links.length >= NAV_LIMITS.maxTopLevel}>
                <Plus className="mr-1 h-4 w-4" /> Add link
              </Button>
            </div>

            {nav.links.length === 0 ? (
              <div className="rounded border border-dashed border-ink/30 p-6 text-center text-sm text-muted-foreground">
                No links yet. Click <b>Add link</b> to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {nav.links.map((l, i) => (
                  <NavigationItemEditor
                    key={l.id}
                    link={l}
                    index={i}
                    total={nav.links.length}
                    onChange={(next) => setLinks(nav.links.map((x, xi) => (xi === i ? next : x)))}
                    onDelete={() => setLinks(nav.links.filter((_, xi) => xi !== i))}
                    onDuplicate={() =>
                      setLinks([...nav.links.slice(0, i + 1), { ...l, id: newId("n") }, ...nav.links.slice(i + 1)])
                    }
                    onMove={(dir) => {
                      const arr = [...nav.links];
                      const j = i + dir;
                      if (j < 0 || j >= arr.length) return;
                      [arr[i], arr[j]] = [arr[j], arr[i]];
                      setLinks(arr);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Header controls */}
          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            <h2 className="mb-3 text-lg font-bold">Header controls</h2>
            <div className="space-y-3">
              <ToggleRow label="Show search icon" checked={nav.showSearch} onChange={(v) => setNav((n) => ({ ...n, showSearch: v }))} />
              <ToggleRow label="Show account icon" checked={nav.showAccount} onChange={(v) => setNav((n) => ({ ...n, showAccount: v }))} />
              <ToggleRow label="Show Project Cart" checked={nav.showProjectCart} onChange={(v) => setNav((n) => ({ ...n, showProjectCart: v }))} />
              <div>
                <Label className="mb-1 block text-xs font-bold uppercase tracking-widest">Project Cart label</Label>
                <Input
                  value={nav.projectCartLabel}
                  maxLength={NAV_LIMITS.maxCartLabelLen}
                  onChange={(e) => setNav((n) => ({ ...n, projectCartLabel: e.target.value }))}
                />
              </div>
              <ToggleRow label="Sticky header" checked={nav.stickyHeader} onChange={(v) => setNav((n) => ({ ...n, stickyHeader: v }))} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <NavigationPreview navigation={nav} brandName={draft.brand.name} />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded border border-ink/10 bg-white px-3 py-2 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={(v) => onChange(!!v)} />
    </div>
  );
}