import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProject } from "@/lib/projects.functions";
import { ProjectStatusBadge } from "@/components/site/ProjectStatusBadge";
import { statusLabel } from "@/lib/project-status";
import { money } from "@/lib/format";
import { ArrowLeft, FileImage, ImageIcon, MessageSquare, Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: ProjectDetail,
});

function fmt(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ProjectDetail() {
  const { id } = useParams({ from: "/_authenticated/projects/$id" });
  const fetchProject = useServerFn(getMyProject);
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-project", id],
    queryFn: () => fetchProject({ data: { id } }),
  });

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Loading project…</div>;
  if (error || !data) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-display text-2xl">Project not found</h1>
      <Link to="/account" className="mt-4 inline-block underline">Back to My Projects</Link>
    </div>
  );

  const { project, history } = data as any;
  const info = (project.shipping_address ?? {}) as any;
  const itemDetails: any[] = info.itemDetails ?? [];
  const artwork = itemDetails.filter((d) => d.artwork);
  const references = itemDetails.filter((d) => d.reference);
  const itemNotes = itemDetails.filter((d) => d.notes);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Link to="/account" className="inline-flex items-center gap-1 text-sm font-semibold underline"><ArrowLeft className="h-4 w-4" /> Back to My Projects</Link>

      <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{project.project_reference}</div>
          <h1 className="mt-1 text-display text-4xl">{info.projectName || "Untitled project"}</h1>
          {info.businessName && <p className="text-sm text-muted-foreground">{info.businessName}</p>}
        </div>
        <ProjectStatusBadge status={project.project_status ?? "submitted"} className="text-sm" />
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <section className="md:col-span-2 space-y-6">
          <Card title="Project Overview">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Submission date" value={fmtDate(project.created_at)} />
              <Field label="Preferred completion" value={fmtDate(info.completionDate)} />
              <Field label="Delivery" value={info.delivery ?? "—"} />
              <Field label="Estimated value" value={money(Number(project.total ?? 0))} />
            </dl>
          </Card>

          <Card title={`Project Items (${(project.order_items ?? []).length})`}>
            <ul className="divide-y-2 divide-ink/10">
              {(project.order_items ?? []).map((it: any) => (
                <li key={it.id} className="py-3 flex items-start justify-between gap-3 text-sm">
                  <div>
                    <div className="font-semibold">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">{it.variant_label} · Qty {it.quantity}</div>
                  </div>
                  <div className="font-bold">{money(Number(it.line_total))}</div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Uploaded Artwork" icon={<FileImage className="h-4 w-4" />}>
            {artwork.length === 0 ? <Empty text="No artwork uploaded." /> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {artwork.map((d, i) => (
                  <li key={i} className="rounded border-2 border-ink bg-cream px-3 py-2 text-sm">
                    <div className="font-semibold truncate">{d.artwork.name}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(d.artwork.size / 1024)} KB · {d.artwork.type || "file"}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Reference Images" icon={<ImageIcon className="h-4 w-4" />}>
            {references.length === 0 ? <Empty text="No reference images provided." /> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {references.map((d, i) => (
                  <li key={i} className="rounded border-2 border-ink bg-cream px-3 py-2 text-sm">
                    <div className="font-semibold truncate">{d.reference.name}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(d.reference.size / 1024)} KB</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Project Notes" icon={<MessageSquare className="h-4 w-4" />}>
            {info.generalNotes ? (
              <p className="whitespace-pre-wrap text-sm">{info.generalNotes}</p>
            ) : (
              <Empty text="No general notes provided." />
            )}
            {itemNotes.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Item notes</div>
                {itemNotes.map((n, i) => (
                  <div key={i} className="rounded border border-ink/20 bg-cream/50 p-2 text-xs">{n.notes}</div>
                ))}
              </div>
            )}
          </Card>

          <ComingSoon title="Quotes" icon={<Receipt className="h-4 w-4" />} />
          <ComingSoon title="Messages" icon={<MessageSquare className="h-4 w-4" />} />
        </section>

        <aside className="space-y-6">
          <Card title="Status Timeline">
            <ol className="space-y-4">
              {(history ?? []).map((h: any, idx: number) => (
                <li key={h.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-magenta ring-2 ring-ink" />
                  <div className="text-sm font-semibold">{statusLabel(h.status)}</div>
                  <div className="text-xs text-muted-foreground">{fmt(h.created_at)}</div>
                  {h.note && <div className="mt-1 text-xs">{h.note}</div>}
                  {idx < (history?.length ?? 0) - 1 && <span className="absolute left-1 top-4 h-full w-px bg-ink/20" />}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Contact Information">
            <dl className="grid gap-2 text-sm">
              <Field label="Name" value={project.full_name ?? "—"} />
              <Field label="Email" value={project.email ?? "—"} />
              <Field label="Phone" value={info.phone ?? "—"} />
              <Field label="Preferred contact" value={info.contactMethod ?? "—"} />
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-ink bg-background p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">{icon}{title}</div>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground">{text}</div>;
}
function ComingSoon({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-ink/30 bg-cream/40 p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{icon}{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">Coming soon.</p>
    </div>
  );
}
