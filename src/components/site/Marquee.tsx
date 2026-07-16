export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-yellow">
      <div className="flex animate-marquee gap-10 whitespace-nowrap py-2 text-sm font-semibold uppercase tracking-widest text-ink">
        {doubled.map((s, i) => (
          <span key={i} className="flex items-center gap-10">
            {s}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-magenta" />
          </span>
        ))}
      </div>
    </div>
  );
}
