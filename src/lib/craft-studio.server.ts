// Server-only helpers for the Craft Studio dashboard status function.

/** Deterministic JSON serialisation so draft vs published can be compared. */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  const walk = (v: any): any => {
    if (v === null || typeof v !== "object") return v;
    if (seen.has(v)) return null;
    seen.add(v);
    if (Array.isArray(v)) return v.map(walk);
    const out: Record<string, any> = {};
    for (const key of Object.keys(v).sort()) out[key] = walk(v[key]);
    return out;
  };
  return JSON.stringify(walk(value));
}
