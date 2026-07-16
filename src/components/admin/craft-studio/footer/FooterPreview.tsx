import { Facebook, Instagram, Linkedin, Youtube, Link as LinkIcon } from "lucide-react";
import type { StorefrontFooter, SocialLink } from "@/lib/theme";
import { currentYearReplace } from "@/lib/storefront/site-config";
import { StorefrontAssetImage } from "@/components/site/StorefrontAssetImage";

const ICONS: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Instagram,
  pinterest: Instagram,
  other: LinkIcon,
};

export function FooterPreview({ footer }: { footer: StorefrontFooter }) {
  if (!footer.enabled) {
    return (
      <div className="rounded-lg border border-dashed border-ink/30 p-6 text-center text-sm text-muted-foreground">
        Footer is disabled. Enable it to preview.
      </div>
    );
  }
  const socials = footer.socialLinks.filter((s) => s.enabled);
  const columns = footer.columns.filter((c) => c.enabled);
  return (
    <div className="rounded-lg border-2 border-ink bg-ink text-cream">
      <div className="grid gap-8 p-6 md:grid-cols-4">
        <div>
          {footer.logoAssetId || footer.logoUrl ? (
            <StorefrontAssetImage assetId={footer.logoAssetId} fallbackUrl={footer.logoUrl} alt={footer.businessName} className="h-8 w-auto" />
          ) : (
            <div className="text-display text-lg font-black">{footer.businessName}</div>
          )}
          <p className="mt-2 max-w-xs text-xs text-cream/70">{footer.description}</p>
          {socials.length > 0 && (
            <div className="mt-3 flex gap-2">
              {socials.map((s) => <SocialIcon key={s.id} s={s} />)}
            </div>
          )}
        </div>
        {columns.map((c) => (
          <div key={c.id}>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow">{c.heading}</div>
            <ul className="space-y-1 text-xs">
              {c.links.filter((l) => l.enabled).map((l) => <li key={l.id}>{l.label}</li>)}
            </ul>
          </div>
        ))}
        {footer.contact.enabled && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-yellow">Contact</div>
            {footer.contact.email && <div className="text-xs">{footer.contact.email}</div>}
            {footer.contact.phone && <div className="text-xs">{footer.contact.phone}</div>}
            {footer.contact.address && <div className="mt-1 whitespace-pre-line text-xs text-cream/70">{footer.contact.address}</div>}
          </div>
        )}
      </div>
      <div className="border-t border-cream/10 px-6 py-3 text-center text-[11px] text-cream/60">
        {currentYearReplace(footer.copyrightText)}
        {footer.showPoweredBy && <span className="ml-2">· Powered by Craft &amp; Cling</span>}
      </div>
    </div>
  );
}

function SocialIcon({ s }: { s: SocialLink }) {
  const Icon = ICONS[s.platform] ?? LinkIcon;
  return (
    <span className="rounded-full border border-cream/30 p-1.5" title={s.label}>
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}