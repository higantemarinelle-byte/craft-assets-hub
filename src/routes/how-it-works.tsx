import { createFileRoute } from "@tanstack/react-router";
import { Flame, Package, Layers, Zap, Truck } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How DTF Printing Works — Craft & Cling" },
      { name: "description", content: "How Direct-to-Film transfers are made and applied. Full CMYK + white ink, press at 315°F for 15 seconds." },
      { property: "og:title", content: "How DTF Printing Works — Craft & Cling" },
      { property: "og:description", content: "How Direct-to-Film transfers are made and applied. Full CMYK + white ink, press at 315°F for 15 seconds." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  const steps = [
    { i: Zap, n: "01", t: "You choose", d: "Pick a ready-to-press design, or upload your art onto a gang sheet in any size." },
    { i: Package, n: "02", t: "We print", d: "CMYK + white ink on 75 micron PET film, powdered with hot-melt adhesive, cured at 320°F." },
    { i: Layers, n: "03", t: "We QC + ship", d: "Every sheet inspected under daylight for color, edge sharpness, and adhesive coverage." },
    { i: Flame, n: "04", t: "You press", d: "Position on garment, cover with parchment, press at 315°F for 15 seconds, warm peel." },
    { i: Truck, n: "05", t: "You wear + wash", d: "Wait 24 hours, then wash inside-out cold. Rated for 50+ washes with proper care." },
  ];
  return (
    <div className="bg-cream">
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
          <div className="text-xs font-bold uppercase tracking-widest text-magenta">The process</div>
          <h1 className="mt-2 text-display text-4xl md:text-6xl">Ink hits film. Film hits fabric.</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/75">
            Direct-to-Film is the fastest, sharpest way to put custom art on any garment. No screens, no vinyl weeding, no minimums. Here's the full cycle.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <div className="space-y-10">
          {steps.map(({ i: Icon, n, t, d }, idx) => (
            <div key={n} className={`grid gap-6 md:grid-cols-12 md:items-center ${idx % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""}`}>
              <div className="md:col-span-5">
                <div className={`aspect-video overflow-hidden rounded-2xl border-2 border-ink cmyk-shadow bg-gradient-to-br ${idx % 3 === 0 ? "from-cyan to-magenta" : idx % 3 === 1 ? "from-magenta to-yellow" : "from-yellow to-cyan"} relative`}>
                  <div className="halftone absolute inset-0 opacity-20" />
                  <div className="text-display absolute inset-0 flex items-center justify-center text-[10rem] leading-none text-ink/20">{n}</div>
                </div>
              </div>
              <div className="md:col-span-7">
                <Icon className="h-8 w-8 text-magenta" />
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {n}</div>
                <h2 className="text-display text-3xl md:text-4xl">{t}</h2>
                <p className="mt-3 text-ink/75">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
