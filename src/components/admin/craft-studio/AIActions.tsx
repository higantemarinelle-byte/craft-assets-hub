import { Sparkles } from "lucide-react";

const ACTIONS = [
  { label: "Rewrite Copy" },
  { label: "Improve Content" },
  { label: "Generate Hero" },
  { label: "Generate CTA" },
];

export function AIActions() {
  return (
    <div className="rounded-lg border-2 border-dashed border-ink/40 bg-cream p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-bold uppercase tracking-widest">AI assistants</div>
          <p className="text-xs text-muted-foreground">Content and layout AI helpers arrive in a future release.</p>
        </div>
        <span className="rounded bg-ink/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink/60">
          Coming Soon
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled
            className="inline-flex items-center gap-1 rounded border-2 border-ink/30 bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink/50"
            title="Coming soon"
          >
            <Sparkles className="h-3 w-3" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
