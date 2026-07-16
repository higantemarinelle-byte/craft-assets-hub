import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FooterColumnV2, FooterLink } from "@/lib/theme";
import {
  FOOTER_LIMITS,
  INTERNAL_ROUTES,
  isSafeExternalUrl,
  isSafeInternalHref,
  newId,
} from "@/lib/storefront/site-config";

type Props = {
  column: FooterColumnV2;
  index: number;
  total: number;
  onChange: (c: FooterColumnV2) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
};

export function FooterColumnEditor({ column, index, total, onChange, onDelete, onDuplicate, onMove }: Props) {
  const patch = (n: Partial<FooterColumnV2>) => onChange({ ...column, ...n });
  const setLinks = (links: FooterLink[]) => patch({ links });

  return (
    <div className="rounded-md border border-ink/15 bg-white p-3">
      <div className="flex items-center gap-2">
        <Input
          value={column.heading}
          maxLength={FOOTER_LIMITS.maxHeadingLen}
          onChange={(e) => patch({ heading: e.target.value })}
          placeholder="Column heading"
          className="flex-1"
        />
        <Switch checked={column.enabled} onCheckedChange={(v) => patch({ enabled: !!v })} />
        <Button variant="ghost" size="icon" onClick={() => onMove(-1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onMove(1)} disabled={index === total - 1}><ArrowDown className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate}><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>

      <div className="mt-3 space-y-2">
        {column.links.map((l, i) => (
          <FooterLinkRow
            key={l.id}
            link={l}
            index={i}
            total={column.links.length}
            onChange={(next) => setLinks(column.links.map((x, xi) => (xi === i ? next : x)))}
            onDelete={() => setLinks(column.links.filter((_, xi) => xi !== i))}
            onDuplicate={() =>
              setLinks([...column.links.slice(0, i + 1), { ...l, id: newId("l") }, ...column.links.slice(i + 1)])
            }
            onMove={(dir) => {
              const arr = [...column.links];
              const j = i + dir;
              if (j < 0 || j >= arr.length) return;
              [arr[i], arr[j]] = [arr[j], arr[i]];
              setLinks(arr);
            }}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setLinks([
              ...column.links,
              { id: newId("l"), label: "New link", type: "internal", href: "/", enabled: true, openInNewTab: false },
            ])
          }
          disabled={column.links.length >= FOOTER_LIMITS.maxLinksPerColumn}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add link
        </Button>
      </div>
    </div>
  );
}

function FooterLinkRow({
  link,
  index,
  total,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
}: {
  link: FooterLink;
  index: number;
  total: number;
  onChange: (l: FooterLink) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const valid = link.type === "internal" ? isSafeInternalHref(link.href) : isSafeExternalUrl(link.href);
  const patch = (n: Partial<FooterLink>) => onChange({ ...link, ...n });
  return (
    <div className="rounded border border-ink/10 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={link.label}
          maxLength={FOOTER_LIMITS.maxLabelLen}
          onChange={(e) => patch({ label: e.target.value })}
          className="flex-1 min-w-[140px]"
          placeholder="Label"
        />
        <Select value={link.type} onValueChange={(v) => patch({ type: v as any, href: v === "internal" ? "/" : "https://" })}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        <Switch checked={link.enabled} onCheckedChange={(v) => patch({ enabled: !!v })} />
        <Button variant="ghost" size="icon" onClick={() => onMove(-1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => onMove(1)} disabled={index === total - 1}><ArrowDown className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDuplicate}><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto]">
        {link.type === "internal" ? (
          <Select value={link.href} onValueChange={(v) => patch({ href: v })}>
            <SelectTrigger><SelectValue placeholder="Choose page" /></SelectTrigger>
            <SelectContent>
              {INTERNAL_ROUTES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={link.href}
            onChange={(e) => patch({ href: e.target.value })}
            placeholder="https://example.com"
            className={valid ? "" : "border-destructive"}
          />
        )}
        <label className="inline-flex items-center gap-1.5 text-xs">
          <Switch checked={link.openInNewTab} onCheckedChange={(v) => patch({ openInNewTab: !!v })} /> New tab
        </label>
      </div>
      {!valid && <p className="mt-1 text-xs text-destructive">Enter a valid URL.</p>}
    </div>
  );
}