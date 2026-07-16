import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme-context";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Craft & Cling — DTF Printers with Standards" },
      { name: "description", content: "Independent DTF print shop obsessed with color, sharpness, and turnaround." },
      { property: "og:title", content: "About Craft & Cling" },
      { property: "og:description", content: "Independent DTF print shop obsessed with color, sharpness, and turnaround." },
    ],
  }),
  ssr: false,
  component: About,
});

function About() {
  const { theme } = useTheme();
  const blocks = theme.pages.about.blocks;
  return (
    <div className="bg-cream">
      <section className="mx-auto max-w-4xl px-4 py-20 md:px-6">
        <div className="text-xs font-bold uppercase tracking-widest text-magenta">About us</div>
        <h1 className="mt-2 text-display text-4xl md:text-6xl">{blocks[0]?.heading ?? "About"}</h1>
        <div className="mt-8 space-y-8 text-lg text-ink/80">
          {blocks.map((b, i) => (
            <div key={i}>
              {i > 0 && <h2 className="text-display text-2xl mb-2">{b.heading}</h2>}
              <p>{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
