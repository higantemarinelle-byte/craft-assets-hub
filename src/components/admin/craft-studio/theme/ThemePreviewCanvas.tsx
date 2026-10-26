// Live storefront preview for the Theme Builder. Renders the real editable
// homepage — announcement, header, hero, marquee, every homepage section in
// order, and the footer — from the unsaved draft theme, and focuses the
// region matching the editor panel the user is currently in.

import { useEffect, useRef, useState } from "react";
import type { Theme, ThemeHomeSection } from "@/lib/theme";
import { StorefrontThemeScope } from "@/components/site/StorefrontThemeScope";
import { Button } from "@/components/ui/button";
import { Monitor, Tablet, Smartphone, Maximize2, PanelLeftOpen } from "lucide-react";
import { currentYearReplace } from "@/lib/storefront/site-config";

type Device = "desktop" | "tablet" | "mobile";
const WIDTHS: Record<Device, number> = { desktop: 1200, tablet: 834, mobile: 390 };

/** Stable identifier for a previewable storefront region. */
export type PreviewFocus = string | null;

export function sectionRegionId(sectionId: string) {
  return `section:${sectionId}`;
}

export function ThemePreviewCanvas({
  theme,
  focus = null,
  expanded = false,
  onToggleExpanded,
}: {
  expanded?: boolean;
  onToggleExpanded?: () => void;
  theme: Theme;
  /** Region to scroll to and outline — e.g. "hero" or "section:featured". */
  focus?: PreviewFocus;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const scrollRef = useRef<HTMLDivElement>(null);
  const width = WIDTHS[device];
  const hero = theme.home.hero;

  // Scroll the focused region into view inside the preview viewport.
  useEffect(() => {
    if (!focus) return;
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-region="${CSS.escape(focus)}"]`);
    if (!el) return;
    const top = el.offsetTop - 12;
    container.scrollTo({ top: top < 0 ? 0 : top, behavior: "smooth" });
  }, [focus, device]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-lg border-2 border-ink bg-muted/40 p-3">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live preview</div>
        <div className="flex items-center gap-1">
          {onToggleExpanded && (
            <Button type="button" size="sm" variant="outline" onClick={onToggleExpanded} className="mr-2 hidden md:inline-flex">
              {expanded ? <><PanelLeftOpen className="mr-1 h-4 w-4" /> Show editor</> : <><Maximize2 className="mr-1 h-4 w-4" /> Expand preview</>}
            </Button>
          )}
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
      <div
        ref={scrollRef}
        className="mx-auto min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-md border-2 border-ink bg-background transition-all"
        style={{ maxWidth: width, width: "100%" }}
      >
        <StorefrontThemeScope tokens={theme.tokens}>
          <div style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)", fontSize: "var(--font-base-size)" }}>
            {/* Announcement */}
            <Region id="announcement" focus={focus}>
              {theme.announcement.enabled && theme.announcement.text ? (
                <div style={{ background: "var(--accent)", color: "var(--accent-foreground)" }} className="px-4 py-2 text-center text-xs font-semibold">
                  {theme.announcement.text}
                </div>
              ) : (
                <HiddenNote label="Announcement bar hidden" />
              )}
            </Region>

            {/* Header */}
            <Region id="navigation" focus={focus}>
              <div className="flex items-center justify-between gap-3 border-b-2 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-heading-weight)", letterSpacing: "var(--font-heading-letter-spacing)" }} className="text-xl">
                  {theme.brand.name}
                </div>
                <div className="flex flex-wrap justify-end gap-3 text-xs">
                  {(theme.navigation?.links ?? []).filter((l) => l.enabled).slice(0, 6).map((l) => (
                    <span key={l.id}>{l.label}</span>
                  ))}
                  {theme.navigation?.showProjectCart !== false && (
                    <span
                      className="rounded px-2 py-0.5 font-semibold"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "var(--button-radius)" }}
                    >
                      {theme.navigation?.projectCartLabel || "Project Cart"}
                    </span>
                  )}
                </div>
              </div>
            </Region>

            {/* Hero */}
            <Region id="hero" focus={focus}>
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
                </div>
              </div>
            </Region>

            {/* Marquee */}
            <Region id="marquee" focus={focus}>
              {theme.home.marquee.enabled && theme.home.marquee.items.length > 0 ? (
                <div className="overflow-hidden border-y-2 px-4 py-2" style={{ borderColor: "var(--border)", background: "var(--secondary)", color: "var(--secondary-foreground)" }}>
                  <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-widest">
                    {theme.home.marquee.items.filter(Boolean).map((s, i) => <span key={i}>{s}</span>)}
                  </div>
                </div>
              ) : (
                <HiddenNote label="Marquee hidden" />
              )}
            </Region>

            {/* Homepage sections in saved order */}
            {theme.home.sections.map((section) => (
              <Region key={section.id} id={sectionRegionId(section.id)} focus={focus}>
                {section.enabled ? (
                  <SectionPreview section={section} theme={theme} />
                ) : (
                  <HiddenNote label={`${(section as any).title || section.type} hidden`} />
                )}
              </Region>
            ))}

            {/* Footer */}
            <Region id="footer" focus={focus}>
              {theme.footerV2?.enabled === false ? (
                <HiddenNote label="Footer hidden" />
              ) : (
                <div className="px-6 py-6" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-sm font-bold">{theme.footerV2?.businessName || theme.brand.name}</div>
                      {theme.footerV2?.description && (
                        <p className="mt-1 text-[10px] opacity-80">{theme.footerV2.description}</p>
                      )}
                    </div>
                    {(theme.footerV2?.columns ?? []).filter((c) => c.enabled).slice(0, 2).map((col) => (
                      <div key={col.id}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{col.heading}</div>
                        <ul className="mt-1 space-y-0.5 text-[10px]">
                          {col.links.filter((l) => l.enabled).map((l) => <li key={l.id}>{l.label}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-3 text-center text-[10px] opacity-70" style={{ borderColor: "currentColor" }}>
                    {currentYearReplace(theme.footerV2?.copyrightText || `© {year} ${theme.brand.name}`)}
                  </div>
                </div>
              )}
            </Region>
          </div>
        </StorefrontThemeScope>
      </div>
    </div>
  );
}

/** Wraps a previewable storefront area with a focus outline + scroll target. */
function Region({ id, focus, children }: { id: string; focus: PreviewFocus; children: React.ReactNode }) {
  const active = focus === id;
  return (
    <div
      data-region={id}
      className="relative scroll-mt-3"
      style={active ? { outline: "2px solid var(--accent)", outlineOffset: "-2px" } : undefined}
    >
      {children}
    </div>
  );
}

function HiddenNote({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-widest opacity-50">
      {label}
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-3">
      {eyebrow && (
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>{eyebrow}</div>
      )}
      <h2
        className="text-xl"
        style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-heading-weight)", letterSpacing: "var(--font-heading-letter-spacing)" }}
      >
        {title}
      </h2>
    </div>
  );
}

function SectionPreview({ section, theme }: { section: ThemeHomeSection; theme: Theme }) {
  const cardStyle: React.CSSProperties = {
    background: "var(--card)",
    color: "var(--card-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--card-radius)",
  };

  if (section.type === "categories") {
    return (
      <div className="px-6 py-6">
        <SectionHeading title={section.title || "Explore by category"} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["Apparel", "Gang sheets", "Custom prints", "Accessories"].map((name) => (
            <div key={name} className="p-3 text-xs font-semibold" style={cardStyle}>
              {name}
              <div className="mt-1 text-[10px] font-normal opacity-60">Sample category</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "featured") {
    return (
      <div className="px-6 py-6">
        <SectionHeading eyebrow={section.eyebrow} title={section.title || "Popular designs"} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="overflow-hidden" style={cardStyle}>
              <div className="h-14 w-full" style={{ background: "var(--muted)" }} />
              <div className="p-2">
                <div className="text-[11px] font-semibold">Sample product {n}</div>
                <div className="text-[10px] opacity-60">$00.00</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "how") {
    return (
      <div className="px-6 py-6" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
        <SectionHeading eyebrow={section.eyebrow} title={section.title || "How it works"} />
        <div className="grid gap-3 sm:grid-cols-4">
          {["Explore products", "Upload artwork", "Submit project", "We review & contact"].map((step, i) => (
            <div key={step}>
              <div className="text-lg font-black" style={{ color: "var(--accent)" }}>{`0${i + 1}`}</div>
              <div className="text-[11px] font-semibold">{step}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "testimonials") {
    const items = section.items?.length ? section.items : [{ quote: "The whites are actually white.", author: "Maya R." }];
    return (
      <div className="px-6 py-6">
        <SectionHeading title={section.title || "Makers who create with us"} />
        <div className="grid gap-3 sm:grid-cols-3">
          {items.slice(0, 3).map((t, i) => (
            <blockquote key={i} className="p-3" style={cardStyle}>
              <p className="text-[11px] leading-snug">“{t.quote}”</p>
              <footer className="mt-2 text-[10px] uppercase tracking-widest opacity-60">— {t.author}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    );
  }

  // banner
  return (
    <div className="px-6 py-6">
      <div className="p-6 text-center" style={{ background: "var(--secondary)", color: "var(--secondary-foreground)", borderRadius: "var(--card-radius)" }}>
        {section.title && (
          <h2 className="text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: "var(--font-heading-weight)" }}>{section.title}</h2>
        )}
        {section.body && <p className="mx-auto mt-2 max-w-md text-xs opacity-80">{section.body}</p>}
        {section.ctaLabel && (
          <div className="mt-3 flex justify-center">
            <PreviewButton theme={theme} variant="primary">{section.ctaLabel}</PreviewButton>
          </div>
        )}
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
