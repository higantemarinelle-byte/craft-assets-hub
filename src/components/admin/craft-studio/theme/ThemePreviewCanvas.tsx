import { useState } from "react";
import type { Theme } from "@/lib/theme";
import { StorefrontThemeScope } from "@/components/site/StorefrontThemeScope";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone } from "lucide-react";

type Device = "desktop" | "tablet" | "mobile";
const WIDTHS: Record<Device, number> = { desktop: 1200, tablet: 834, mobile: 390 };

export function ThemePreviewCanvas({ theme }: { theme: Theme }) {
  const [device, setDevice] = useState<Device>("desktop");
  const width = WIDTHS[device];
  const hero = theme.home.hero;

  return (
    <div className="rounded-lg border-2 border-ink bg-muted/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live preview</div>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant={device === "desktop" ? "default" : "outline"} onClick={() => setDevice("desktop")} aria-label="Desktop">
            <Monitor className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant={device === "tablet" ? "default" : "outline"} onClick={() => setDevice("tablet")} aria-label="Tablet">
            <Tablet className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant={device === "mobile" ? "default" : "outline"} onClick={() => setDevice("mobile")} aria-label="Mobile">
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mx-auto overflow-hidden rounded-md border-2 border-ink bg-background transition-all"
        style={{ maxWidth: width, width: "100%" }}
      >
        <StorefrontThemeScope tokens={theme.tokens}>
          <div style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)", fontSize: "var(--font-base-size)" }}>
            {/* Announcement */}
            {theme.announcement.enabled && theme.announcement.text && (
              <div style={{ background: "var(--accent)", color: "var(--accent-foreground)" }} className="px-4 py-2 text-center text-xs font-semibold">
                {theme.announcement.text}
              </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-heading-weight)", letterSpacing: "var(--font-heading-letter-spacing)" }} className="text-xl">
                {theme.brand.name}
              </div>
              <div className="hidden gap-4 text-xs md:flex">
                {theme.nav.items.slice(0, 4).map((n) => <span key={n.label}>{n.label}</span>)}
              </div>
            </div>
            {/* Hero */}
            <div className="px-6 py-10">
              <div className="mb-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: "var(--highlight, var(--secondary))", color: "var(--foreground)" }}>
                {hero.eyebrow}
              </div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-heading-weight)", letterSpacing: "var(--font-heading-letter-spacing)" }} className="text-3xl leading-tight md:text-5xl">
                <span style={{ color: hero.headlineAColor ?? "var(--foreground)" }}>{hero.headlineA}</span>{" "}
                <span style={{ color: hero.headlineHighlightAColor ?? "var(--accent)" }}>{hero.headlineHighlightA}</span>{" "}
                <span style={{ color: hero.headlineBColor ?? "var(--foreground)" }}>{hero.headlineB}</span>{" "}
                <span style={{ color: hero.headlineHighlightBColor ?? "var(--secondary)" }}>{hero.headlineHighlightB}</span>
              </h1>
              <p className="mt-3 max-w-md text-sm opacity-80">{hero.body}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <PreviewButton theme={theme} variant="primary">{hero.ctaPrimaryLabel}</PreviewButton>
                <PreviewButton theme={theme} variant="secondary">{hero.ctaSecondaryLabel}</PreviewButton>
                <PreviewButton theme={theme} variant="primary" disabled>Disabled</PreviewButton>
              </div>
            </div>
            {/* Card + form + badge */}
            <div className="grid gap-4 px-6 pb-8 md:grid-cols-3">
              <div className="rounded p-4" style={{ background: "var(--card)", color: "var(--card-foreground)", border: "1px solid var(--border)", borderRadius: "var(--card-radius)" }}>
                <div className="text-xs font-bold uppercase" style={{ color: "var(--accent)" }}>New</div>
                <div className="mt-1 text-lg font-semibold">Product card</div>
                <div className="text-xs opacity-70">Sample copy for a storefront card.</div>
              </div>
              <div className="rounded p-4" style={{ background: "var(--muted)", color: "var(--muted-foreground)", borderRadius: "var(--card-radius)" }}>
                <label className="text-xs font-semibold">Email</label>
                <input className="mt-1 w-full rounded px-2 py-1 text-sm" style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }} placeholder="you@example.com" readOnly />
              </div>
              <div className="flex items-center gap-2 rounded p-4" style={{ background: "var(--secondary)", color: "var(--secondary-foreground)", borderRadius: "var(--card-radius)" }}>
                <span className="text-xs font-bold uppercase">Badge</span>
                <span className="text-sm">Featured</span>
              </div>
            </div>
            {/* Footer sample */}
            <div className="px-6 py-4 text-center text-[10px]" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {theme.footer.legal || `© ${theme.brand.name}`}
            </div>
          </div>
        </StorefrontThemeScope>
      </div>
    </div>
  );
}

function PreviewButton({ theme, variant, children, disabled }: { theme: Theme; variant: "primary" | "secondary"; children: React.ReactNode; disabled?: boolean }) {
  const style = theme.tokens.buttons.style;
  const isPrimary = variant === "primary";
  const bg = isPrimary ? "var(--primary)" : "var(--secondary)";
  const fg = isPrimary ? "var(--primary-foreground)" : "var(--secondary-foreground)";
  const base: React.CSSProperties = {
    borderRadius: "var(--button-radius)",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
  if (style === "solid") return <span style={{ ...base, background: bg, color: fg, border: `2px solid ${bg}` }}>{children}</span>;
  if (style === "outline") return <span style={{ ...base, background: "transparent", color: bg, border: `2px solid ${bg}` }}>{children}</span>;
  return <span style={{ ...base, background: `color-mix(in oklab, ${bg} 15%, transparent)`, color: bg, border: "2px solid transparent" }}>{children}</span>;
}