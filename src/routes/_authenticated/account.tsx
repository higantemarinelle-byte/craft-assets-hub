import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMyProjects } from "@/lib/projects.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ProjectStatusBadge } from "@/components/site/ProjectStatusBadge";
import { CalendarDays, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Projects — Craft & Cling" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function formatDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Account() {
  const { user, signOut, isStaff } = useAuth();
  const fetchProjects = useServerFn(listMyProjects);
  const { data: projects = [] } = useQuery({ queryKey: ["my-projects"], queryFn: () => fetchProjects() });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display text-4xl">My Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isStaff && (
            <Link to="/portal-admin">
              <Button variant="outline" className="border-2 border-ink font-semibold hover:bg-yellow">Admin portal</Button>
            </Link>
          )}
          <Link to="/shop">
            <Button className="border-2 border-ink bg-ink font-semibold text-cream hover:bg-magenta hover:border-magenta">Start a project</Button>
          </Link>
          <Button onClick={() => signOut()} variant="outline" className="border-2 border-ink font-semibold hover:bg-yellow">Sign out</Button>
        </div>
      </div>

      <section className="mt-10">
        {projects.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-ink/30 p-10 text-center text-muted-foreground">
            No projects yet — <Link to="/shop" className="underline">start a project</Link>.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((p: any) => {
              const proj = (p.shipping_address ?? {}) as any;
              const itemCount = (p.order_items ?? []).length;
              return (
                <li key={p.id}>
                  <Link
                    to="/projects/$id"
                    params={{ id: p.id }}
                    className="block rounded-lg border-2 border-ink bg-cream p-5 transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          {p.project_reference ?? p.order_number}
                        </div>
                        <div className="text-display text-xl mt-1">
                          {proj.projectName || "Untitled project"}
                        </div>
                      </div>
                      <ProjectStatusBadge status={p.project_status ?? "submitted"} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <dt className="uppercase tracking-widest text-muted-foreground">Submitted</dt>
                        <dd className="font-semibold">{formatDate(p.created_at)}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-widest text-muted-foreground">Preferred completion</dt>
                        <dd className="font-semibold">{formatDate(proj.completionDate)}</dd>
                      </div>
                      <div className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" /> {itemCount} item{itemCount === 1 ? "" : "s"}</div>
                      <div className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {proj.contactMethod ?? "—"}</div>
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
