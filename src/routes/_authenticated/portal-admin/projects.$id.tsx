import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  adminGetProject,
  adminUpdateProjectStatus,
  adminUpdateProjectInternalNotes,
} from "@/lib/projects.functions";
import { ProjectStatusBadge } from "@/components/site/ProjectStatusBadge";
import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileImage, ImageIcon, Lock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-admin/projects/$id")({
  head: () => ({ meta: [{ title: "Project — Craft OS" }, { name: "robots", content: "noindex" }] }),
  component: AdminProjectDetail,
});

function fmt(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminProjectDetail() {
  const { id } = useParams({ from: "/_authenticated/portal-admin/projects/$id" });
  const fetchProject = useServerFn(adminGetProject);
  const updateStatus = useServerFn(adminUpdateProjectStatus);
  const updateNotes = useServerFn(adminUpdateProjectInternalNotes);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-project", id], queryFn: () => fetchProject({ data: { id } }) });

  const [nextStatus, setNextStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    if (data?.project) {
      setNextStatus(data.project.project_status ?? "submitted");
      setInternalNotes(data.project.internal_notes ?? "");
    }
  }, [data]);

  const statusMutation = useMutation({
    mutationFn: () => updateStatus({ data: { id, status: nextStatus, note: statusNote || undefined } }),
    onSuccess: () => {
      toast.success("Status updated");
      setStatusNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-project", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    },
    onError: (e: any) => toast.error("Could not update", { description: e?.message }),
  });

  const notesMutation = useMutation({
    mutationFn: () => updateNotes({ data: { id, internal_notes: internalNotes } }),
    onSuccess: () => toast.success("Internal notes saved"),
    onError: (e: any) => toast.error("Could not save", { description: e?.message }),
  });

  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  const { project, history } = data as any;
  const info = (project.shipping_address ?? {}) as any;
  const itemDetails: any[] = info.itemDetails ?? [];
  const artwork = itemDetails.filter((d) => d.artwork);
  const references = itemDetails.filter((d) => d.reference);

  return (
    <div className="space-y-6">
      <Link to="/portal-admin/projects" className="inline-flex items-center gap-1 text-sm font-semibold underline"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link>

      <header className="flex flex-col gap-3 rounded-lg border-2 border-ink bg-background p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{project.project_reference}</div>
          <h1 className="mt-1 text-display text-3xl">{info.projectName || "Untitled project"}</h1>
          {info.businessName && <div className="text-sm text-muted-foreground">{info.businessName}</div>}
          <div className="mt-1 text-sm">{project.full_name} · {project.email}</div>
        </div>
        <ProjectStatusBadge status={project.project_status ?? "submitted"} className="text-sm" />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <Card title="Customer Information">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Full name" value={project.full_name ?? "—"} />
              <Field label="Email" value={project.email ?? "—"} />
              <Field label="Phone" value={info.phone ?? "—"} />
              <Field label="Preferred contact" value={info.contactMethod ?? "—"} />
              <Field label="Delivery" value={info.delivery ?? "—"} />
              <Field label="Business" value={info.businessName ?? "—"} />
            </dl>
          </Card>

          <Card title="Project Information">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Submitted" value={fmt(project.created_at)} />
              <Field label="Preferred completion" value={fmtDate(info.completionDate)} />
              <Field label="Estimated value" value={money(Number(project.total ?? 0))} />
              <Field label="Order number" value={project.order_number} />
            </dl>
          </Card>

          <Card title={`Items (${(project.order_items ?? []).length})`}>
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

          <Card title="Artwork" icon={<FileImage className="h-4 w-4" />}>
            {artwork.length === 0 ? <div className="text-sm text-muted-foreground">None</div> : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {artwork.map((d, i) => (
                  <li key={i} className="rounded border-2 border-ink bg-cream px-3 py-2 text-sm">
                    <div className="font-semibold truncate">{d.artwork.name}</div>
                    <div className="text-xs text-muted-foreground">{Math.round(d.artwork.size / 1024)} KB · {d.artwork.type}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Reference images" icon={<ImageIcon className="h-4 w-4" />}>
            {references.length === 0 ? <div className="text-sm text-muted-foreground">None</div> : (
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

          <Card title="Customer Notes" icon={<MessageSquare className="h-4 w-4" />}>
            {info.generalNotes ? (
              <p className="whitespace-pre-wrap text-sm">{info.generalNotes}</p>
            ) : (
              <div className="text-sm text-muted-foreground">No notes provided.</div>
            )}
          </Card>
        </section>

        <aside className="space-y-6">
          <Card title="Quick Status Update">
            <div className="space-y-3">
              <Select value={nextStatus} onValueChange={setNextStatus}>
                <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Optional note for timeline"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="border-2 border-ink"
              />
              <Button
                onClick={() => statusMutation.mutate()}
                disabled={statusMutation.isPending || nextStatus === project.project_status && !statusNote}
                className="w-full border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta"
              >
                {statusMutation.isPending ? "Saving…" : "Update status"}
              </Button>
            </div>
          </Card>

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

          <Card title="Internal Notes" icon={<Lock className="h-4 w-4" />}>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="min-h-32 border-2 border-ink"
              placeholder="Visible to staff only"
            />
            <Button
              onClick={() => notesMutation.mutate()}
              disabled={notesMutation.isPending}
              variant="outline"
              className="mt-2 w-full border-2 border-ink font-semibold hover:bg-yellow"
            >
              {notesMutation.isPending ? "Saving…" : "Save internal notes"}
            </Button>
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
