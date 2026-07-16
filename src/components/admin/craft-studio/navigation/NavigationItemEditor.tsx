import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import type { NavigationLink } from "@/lib/theme";
import {
  INTERNAL_ROUTES,
  NAV_LIMITS,
  isSafeExternalUrl,
  isSafeInternalHref,
  newId,
} from "@/lib/storefront/site-config";

type Props = {
  link: NavigationLink;
  index: number;
  total: number;
  onChange: (next: NavigationLink) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
  allowChildren?: boolean;
};

export function NavigationItemEditor({
  link,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  allowChildren = true,
}: Props) {
  const hrefValid =
    link.type === "internal" ? isSafeInternalHref(link.href) : isSafeExternalUrl(link.href);

  const patch = (next: Partial<NavigationLink>) => onChange({ ...link, ...next });

  return (
    <div className="rounded-md border border-ink/15 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[160px]">
          <Input
            value={link.label}
            maxLength={NAV_LIMITS.maxLabelLen}
            onChange={(e) => patch({ label: e.target.value })}
            placeholder="Label"
          />
        </div>
        <Select value={link.type} onValueChange={(v) => patch({ type: v as any, href: v === "internal" ? "/" : "https://" })}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch checked={link.enabled} onCheckedChange={(v) => patch({ enabled: !!v })} />
          <span className="text-xs text-muted-foreground">{link.enabled ? "On" : "Off"}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onMove(-1)} disabled={index === 0} title="Move up"><ArrowUp className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onMove(1)} disabled={index === total - 1} title="Move down"><ArrowDown className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDuplicate} title="Duplicate"><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete} title="Delete"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
        {link.type === "internal" ? (
          <Select value={link.href} onValueChange={(v) => patch({ href: v })}>
            <SelectTrigger><SelectValue placeholder="Choose page" /></SelectTrigger>
            <SelectContent>
              {INTERNAL_ROUTES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label} <span className="text-muted-foreground">— {r.value}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={link.href}
            onChange={(e) => patch({ href: e.target.value })}
            placeholder="https://example.com"
            maxLength={NAV_LIMITS.maxHrefLen}
            className={hrefValid ? "" : "border-destructive"}
          />
        )}
        <label className="inline-flex items-center gap-1.5 text-xs">
          <Switch checked={link.openInNewTab} onCheckedChange={(v) => patch({ openInNewTab: !!v })} />
          New tab
        </label>
      </div>
      {!hrefValid && (
        <p className="mt-1 text-xs text-destructive">
          {link.type === "internal" ? "Choose a valid internal page." : "Enter a valid https:// URL."}
        </p>
      )}

      {allowChildren && (
        <div className="mt-3 rounded border border-dashed border-ink/20 p-2">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-xs font-bold uppercase tracking-widest">Dropdown children ({link.children.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                patch({
                  children: [
                    ...link.children,
                    { id: newId("n"), label: "New link", type: "internal", href: "/", enabled: true, openInNewTab: false, children: [] },
                  ],
                })
              }
              disabled={link.children.length >= NAV_LIMITS.maxChildren}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add child
            </Button>
          </div>
          <div className="space-y-2">
            {link.children.map((c, i) => (
              <NavigationItemEditor
                key={c.id}
                link={c}
                index={i}
                total={link.children.length}
                onChange={(next) => patch({ children: link.children.map((x, xi) => (xi === i ? next : x)) })}
                onDelete={() => patch({ children: link.children.filter((_, xi) => xi !== i) })}
                onDuplicate={() => patch({ children: [...link.children.slice(0, i + 1), { ...c, id: newId("n") }, ...link.children.slice(i + 1)] })}
                onMove={(dir) => {
                  const arr = [...link.children];
                  const j = i + dir;
                  if (j < 0 || j >= arr.length) return;
                  [arr[i], arr[j]] = [arr[j], arr[i]];
                  patch({ children: arr });
                }}
                allowChildren={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}