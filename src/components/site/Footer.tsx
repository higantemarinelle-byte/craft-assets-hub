import { Instagram, Mail, Twitter, Facebook } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const SOCIAL_ICON: Record<string, any> = { instagram: Instagram, twitter: Twitter, facebook: Facebook, email: Mail, tiktok: Instagram };

export function Footer() {
  const { theme } = useTheme();
  const brandName = theme.brand.name || "Craft & Cling";
  const [first, ...rest] = brandName.split(" ");
  const middle = rest[0] ?? "";
  const last = rest.slice(1).join(" ");

  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div>
          <div className="text-display text-2xl">
            {first}{middle && <> <span className="text-magenta">{middle}</span></>}{last && ` ${last}`}
          </div>
          <p className="mt-3 max-w-xs text-sm text-cream/70">{theme.footer.blurb}</p>
          <div className="mt-4 flex gap-3">
            {theme.footer.socials.map((s, i) => {
              const Icon = SOCIAL_ICON[s.kind] ?? Mail;
              return (
                <a key={i} href={s.href} className="rounded-full border border-cream/30 p-2 hover:bg-cream hover:text-ink" aria-label={s.kind}>
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        {theme.footer.columns.map((col) => (
          <div key={col.title}>
            <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow">{col.title}</div>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href + l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow">Contact</div>
          {theme.footer.contactEmail && (
            <a href={`mailto:${theme.footer.contactEmail}`} className="text-sm hover:text-yellow">{theme.footer.contactEmail}</a>
          )}
        </div>
      </div>
      <div className="border-t border-cream/10 px-4 py-4 text-center text-xs text-cream/50 md:px-6">
        {theme.footer.legal || `© ${brandName}`}
      </div>
    </footer>
  );
}
