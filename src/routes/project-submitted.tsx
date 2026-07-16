import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Sparkles, FileSearch, Receipt, ThumbsUp, Printer, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/project-submitted")({
  validateSearch: z.object({
    ref: z.string().optional(),
    contact: z.string().optional(),
    completion: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Project Submitted — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: ProjectSubmitted,
});

const steps = [
  { key: "received", label: "Received", icon: Sparkles, done: true },
  { key: "review", label: "Craft Review", icon: FileSearch, done: false },
  { key: "quotation", label: "Quotation", icon: Receipt, done: false },
  { key: "approval", label: "Approval", icon: ThumbsUp, done: false },
  { key: "production", label: "Production", icon: Printer, done: false },
  { key: "completed", label: "Completed", icon: PackageCheck, done: false },
];

function ProjectSubmitted() {
  const { ref, contact, completion } = Route.useSearch();
  const submittedAt = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-yellow">
          <CheckCircle2 className="h-8 w-8 text-ink" />
        </div>
        <h1 className="mt-6 text-display text-4xl md:text-5xl">Project Received</h1>
        <p className="mt-4 text-lg text-ink/75">
          Thank you for choosing Craft &amp; Cling. Our team will carefully review your artwork and details.
        </p>
        <p className="mt-2 text-sm text-ink/70">
          If we notice anything that could improve print quality, we'll reach out before production begins.
        </p>
      </div>

      <div className="mt-10 grid gap-4 rounded-lg border-2 border-ink bg-cream p-6 sm:grid-cols-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project reference</div>
          <div className="text-display text-2xl">{ref ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submission date</div>
          <div className="text-lg font-semibold">{submittedAt}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred contact</div>
          <div className="text-lg font-semibold">{contact ?? "—"}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Estimated review time</div>
          <div className="text-lg font-semibold">Within 24 hours</div>
        </div>
        {completion && (
          <div className="sm:col-span-2">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred completion</div>
            <div className="text-lg font-semibold">{completion}</div>
          </div>
        )}
        <div className="sm:col-span-2">
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Project status</div>
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-yellow px-3 py-1 text-sm font-bold">
            <span className="h-2 w-2 rounded-full bg-magenta" /> Received
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-10">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What happens next</div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3 md:grid-cols-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative rounded-lg border-2 border-ink bg-cream p-3 text-center">
                <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink ${s.done ? "bg-magenta text-cream" : "bg-cream text-ink/60"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest">{i + 1}. {s.label}</div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/cart">
          <Button size="lg" className="border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">
            Start Another Project
          </Button>
        </Link>
        <Link to="/account">
          <Button variant="outline" size="lg" className="border-2 border-ink font-bold hover:bg-yellow">
            View My Projects
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="outline" size="lg" className="border-2 border-ink font-bold hover:bg-yellow">
            Explore Products
          </Button>
        </Link>
      </div>
    </div>
  );
}
