import { Facebook, Instagram, Linkedin, Mail, Youtube, Link as LinkIcon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { StorefrontAssetImage } from "@/components/site/StorefrontAssetImage";
import { currentYearReplace } from "@/lib/storefront/site-config";
import type { FooterLink as FooterLinkT, SocialLink } from "@/lib/theme";

const SOCIAL_ICON: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Instagram,
  pinterest: Instagram,
  other: LinkIcon,
};

export function Footer() {
  const { theme } = useTheme();
  const f = theme.footerV2;
  if (!f?.enabled) return null;
  const brandName = f.businessName || theme.brand.name || "Craft & Cling";
  const columns = (f.columns ?? []).filter((c) => c.enabled);
  const socials = (f.socialLinks ?? []).filter((s) => s.enabled);
  const gridCols = 1 + columns.length + (f.contact.enabled ? 1 : 0);
  const gridClass =
    gridCols >= 4 ? "md:grid-cols-4" : gridCols === 3 ? "md:grid-cols-3" : gridCols === 2 ? "md:grid-cols-2" : "";

  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-cream">
      <div className={`mx-auto grid max-w-7xl gap-10 px-4 py-14 md:px-6 ${gridClass}`}>
        <div>
          {f.logoAssetId || f.logoUrl ? (
            <StorefrontAssetImage assetId={f.logoAssetId} fallbackUrl={f.logoUrl} alt={brandName} className="h-9 w-auto" />
          ) : (
            <div className="text-display text-2xl">{brandName}</div>
          )}
          {f.description && <p className="mt-3 max-w-xs text-sm text-cream/70">{f.description}</p>}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-3">
              {socials.map((s) => <SocialIcon key={s.id} social={s} />)}
            </div>
          )}
        </div>

        {columns.map((col) => (
          <div key={col.id}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow">{col.heading}</div>
            <ul className="space-y-2 text-sm">
              {col.links.filter((l) => l.enabled).map((l) => (
                <li key={l.id}><FooterLink link={l} /></li>
              ))}
            </ul>
          </div>
        ))}

        {f.contact.enabled && (
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow">Contact</div>
            {f.contact.email && (
              <a href={`mailto:${f.contact.email}`} className="block text-sm hover:text-yellow">
                <Mail className="mr-1 inline h-3.5 w-3.5" /> {f.contact.email}
              </a>
            )}
            {f.contact.phone && (
              <a href={`tel:${f.contact.phone.replace(/\s/g, "")}`} className="block text-sm hover:text-yellow">{f.contact.phone}</a>
            )}
            {f.contact.address && (
              <div className="mt-1 whitespace-pre-line text-sm text-cream/70">{f.contact.address}</div>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-cream/10 px-4 py-4 text-center text-xs text-cream/50 md:px-6">
        {currentYearReplace(f.copyrightText || `© {year} ${brandName}`)}
        {f.showPoweredBy && <span className="ml-2">· Powered by Craft &amp; Cling</span>}
      </div>
    </footer>
  );
}

function FooterLink({ link }: { link: FooterLinkT }) {
  const props = link.type === "external"
    ? { href: link.href, target: link.openInNewTab ? "_blank" : undefined, rel: link.openInNewTab ? "noopener noreferrer" : undefined }
    : { href: link.href };
  return <a {...props} className="hover:text-yellow">{link.label}</a>;
}

function SocialIcon({ social }: { social: SocialLink }) {
  const Icon = SOCIAL_ICON[social.platform] ?? LinkIcon;
  return (
    <a
      href={social.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={social.label || social.platform}
      className="rounded-full border border-cream/30 p-2 hover:bg-cream hover:text-ink"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
