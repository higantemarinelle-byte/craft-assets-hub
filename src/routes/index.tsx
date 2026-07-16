import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap, Layers, Package, Sparkles } from "lucide-react";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/site/ProductCard";
import { Marquee } from "@/components/site/Marquee";
import { useTheme } from "@/lib/theme-context";
import { StorefrontAssetImage } from "@/components/site/StorefrontAssetImage";
import { resolveHeroColors } from "@/lib/theme";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  const { theme } = useTheme();
  const { data: categories = [] } = useQuery({ queryKey: ["home:categories"], queryFn: () => listCategories() });
  const { data: featured = [] } = useQuery({ queryKey: ["home:featured"], queryFn: () => listProducts({ data: { featured: true, limit: 8 } }) });

  const hero = theme.home.hero;
  const heroColors = resolveHeroColors(theme);

  return (
    <div className="bg-cream">
      {/* HERO */}
      <section className="relative overflow-hidden border-b-2 border-ink">
        <div className="halftone absolute inset-0 opacity-[0.06]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-12 md:gap-8 md:px-6 md:py-24">
          <div className="md:col-span-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-yellow px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" /> {hero.eyebrow}
            </div>
            <h1 className="text-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.9] tracking-tight text-ink">
              <span style={{ color: heroColors.headlineA }}>{hero.headlineA}</span>{" "}
              <span style={{ color: heroColors.headlineHighlightA }}>{hero.headlineHighlightA}</span>
              <br />
              <span style={{ color: heroColors.headlineB }}>{hero.headlineB}</span>{" "}
              <span style={{ color: heroColors.headlineHighlightB }}>{hero.headlineHighlightB}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink/75">{hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={hero.ctaPrimaryHref} className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream transition hover:bg-magenta hover:border-magenta">
                {hero.ctaPrimaryLabel} <ArrowRight className="h-4 w-4" />
              </a>
              <a href={hero.ctaSecondaryHref} className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-6 py-3 text-sm font-bold text-ink transition hover:bg-yellow">
                {hero.ctaSecondaryLabel}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-widest text-ink/60">
              {theme.pages.product.trustBadges.map((b) => <span key={b}>✓ {b}</span>)}
            </div>
          </div>
          <div className="relative md:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border-2 border-ink bg-ink cmyk-shadow">
              {hero.imageAssetId || hero.imageUrl ? (
                <StorefrontAssetImage
                  assetId={hero.imageAssetId}
                  fallbackUrl={hero.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-magenta via-magenta/70 to-cyan" />
                  <div className="halftone absolute inset-0 opacity-20" />
                  <div className="relative flex h-full flex-col justify-between p-8 text-cream">
                    <div className="text-xs font-bold uppercase tracking-[0.3em]">CMYK · Direct to film</div>
                    <div>
                      <div className="text-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.85] tracking-tight">
                        Ink<br />hits<br /><span className="text-yellow">film.</span>
                      </div>
                      <div className="mt-6 flex items-center gap-3 text-xs">
                        <span className="inline-block h-3 w-3 rounded-full bg-cyan" />
                        <span className="inline-block h-3 w-3 rounded-full bg-magenta" />
                        <span className="inline-block h-3 w-3 rounded-full bg-yellow" />
                        <span className="inline-block h-3 w-3 rounded-full bg-cream" />
                        <span className="ml-2 opacity-70">Every color, every fabric.</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {theme.home.marquee.enabled && <Marquee items={theme.home.marquee.items} />}

      {theme.home.sections.filter((s) => s.enabled).map((section) => {
        if (section.type === "categories") {
          return (
            <section key={section.id} className="mx-auto max-w-7xl px-4 py-16 md:px-6">
              <div className="mb-8 flex items-end justify-between">
                <h2 className="text-display text-3xl md:text-4xl">{section.title ?? "Shop by category"}</h2>
                <Link to="/shop" className="text-sm font-semibold underline underline-offset-4 hover:text-magenta">View all →</Link>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {categories.map((cat, i) => {
                  const bgs = ["bg-cyan", "bg-magenta text-cream", "bg-yellow", "bg-ink text-cream"];
                  const icons = [Zap, Layers, Sparkles, Package];
                  const Icon = icons[i % 4];
                  return (
                    <Link key={cat.id} to="/shop" search={{ category: cat.slug } as never} className={`group relative overflow-hidden rounded-lg border-2 border-ink p-6 transition hover:cmyk-shadow ${bgs[i % 4]}`}>
                      <Icon className="mb-6 h-8 w-8" />
                      <div className="text-display text-2xl">{cat.name}</div>
                      <div className="mt-1 text-sm opacity-80">{cat.description}</div>
                      <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
                        Browse <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        }
        if (section.type === "featured") {
          return (
            <section key={section.id} className="mx-auto max-w-7xl px-4 py-8 md:px-6">
              <div className="mb-8 flex items-end justify-between">
                <div>
                  {section.eyebrow && <div className="text-xs font-bold uppercase tracking-widest text-magenta">{section.eyebrow}</div>}
                  <h2 className="text-display text-3xl md:text-4xl">{section.title ?? "Best sellers"}</h2>
                </div>
                <Link to="/shop" className="text-sm font-semibold underline underline-offset-4 hover:text-magenta">View all →</Link>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          );
        }
        if (section.type === "how") {
          return (
            <section key={section.id} className="mt-16 border-y-2 border-ink bg-ink text-cream">
              <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
                {section.eyebrow && <div className="text-xs font-bold uppercase tracking-widest text-yellow">{section.eyebrow}</div>}
                <h2 className="mt-2 text-display text-3xl md:text-5xl">{section.title ?? "Three steps to shirt."}</h2>
                <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {[
                    { n: "01", t: "Explore Products", d: "Browse ready-to-press designs, custom prints, and gang sheets." },
                    { n: "02", t: "Upload Your Artwork", d: "Add your files or pick designs to build your project cart." },
                    { n: "03", t: "Submit Your Project", d: "Send us your project — no payment collected online." },
                    { n: "04", t: "We Review & Contact You", d: "We'll review your artwork and reach out within 24 hours." },
                  ].map((s) => (
                    <div key={s.n}>
                      <div className="text-display text-6xl text-magenta">{s.n}</div>
                      <div className="mt-2 text-display text-xl">{s.t}</div>
                      <p className="mt-2 text-sm text-cream/70">{s.d}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-md border-2 border-cream px-5 py-2.5 text-sm font-bold hover:bg-cream hover:text-ink">
                    Full guide <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          );
        }
        if (section.type === "testimonials") {
          const items = section.items?.length ? section.items : [
            { quote: "The whites are actually white.", author: "Maya R." },
          ];
          return (
            <section key={section.id} className="mx-auto max-w-7xl px-4 py-20 md:px-6">
              <h2 className="text-display text-3xl md:text-4xl">{section.title ?? "Makers who ship with us"}</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {items.map((t, i) => (
                  <blockquote key={i} className="rounded-lg border-2 border-ink bg-cream p-6">
                    <p className="text-display text-lg leading-snug">"{t.quote}"</p>
                    <footer className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">— {t.author}</footer>
                  </blockquote>
                ))}
              </div>
            </section>
          );
        }
        if (section.type === "banner") {
          return (
            <section key={section.id} className={`mx-auto my-12 max-w-7xl px-4 md:px-6`}>
              <div className={`rounded-2xl border-2 border-ink ${section.bg ?? "bg-yellow"} p-10 text-center cmyk-shadow`}>
                {section.title && <h2 className="text-display text-3xl md:text-5xl">{section.title}</h2>}
                {section.body && <p className="mx-auto mt-3 max-w-2xl text-lg">{section.body}</p>}
                {section.ctaHref && (
                  <a href={section.ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-ink px-6 py-3 text-sm font-bold text-cream hover:bg-magenta">
                    {section.ctaLabel ?? "Learn more"} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}
