import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/quote-submitted")({
  head: () => ({
    meta: [
      { title: "Quote request received — Craft & Cling" },
      { name: "description", content: "Thanks — your gang sheet quote request is with our team. We'll review the artwork and get back to you." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : "" }),
  component: QuoteSubmitted,
});

function QuoteSubmitted() {
  const { ref } = Route.useSearch();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h1 className="text-display text-4xl md:text-5xl">Quote request received!</h1>
      <p className="mt-3 text-muted-foreground">
        Thanks — Craft &amp; Cling is reviewing your artwork. We'll confirm the price and reach out shortly.
      </p>
      {ref && (
        <div className="mx-auto mt-6 inline-block rounded-lg border-2 border-ink bg-cream px-6 py-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your reference</div>
          <div className="text-display text-2xl">{ref}</div>
        </div>
      )}
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild variant="outline"><Link to="/gang-sheet">Build another sheet</Link></Button>
        <Button asChild><Link to="/shop">Explore products</Link></Button>
      </div>
    </div>
  );
}