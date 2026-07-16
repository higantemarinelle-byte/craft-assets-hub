import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adminListProjects } from "@/lib/projects.functions";
import { ProjectStatusBadge } from "@/components/site/ProjectStatusBadge";
import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal-admin/projects")({
  head: () => ({ meta: [{ title: "Projects — Craft OS" }, { name: "robots", content: "noindex" }] }),
  component: AdminProjects,
});

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function AdminProjects() {
  const fetchProjects = useServerFn(adminListProjects);
  const { data: projects = [], isLoading } = useQuery({ queryKey: ["admin-projects"], queryFn: () => fetchProjects() });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (projects as any[]).filter((p) => {
      const info = (p.shipping_address ?? {}) as any;
      if (status !== "all" && (p.project_status ?? "submitted") !== status) return false;
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(p.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (!q) return true;
      const hay = [
        p.project_reference,
        p.order_number,
        p.full_name,
        p.email,
        info.businessName,
        info.projectName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return list;
  }, [projects, search, status, sort, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-display text-3xl">Projects</h1>
          <p className="text-sm text-muted-foreground">All submitted projects across Craft OS.</p>
        </div>
        <div className="text-xs text-muted-foreground">{filtered.length} of {(projects as any[]).length}</div>
      </div>

      <div className="grid gap-3 rounded-lg border-2 border-ink bg-background p-4 md:grid-cols-5">
        <div className="md:col-span-2 relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, customer, business, email"
            className="border-2 border-ink pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="border-2 border-ink"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-2 border-ink" aria-label="From date" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-2 border-ink" aria-label="To date" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border-2 border-ink bg-background">
        <table className="w-full text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-widest">
            <tr>
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Preferred completion</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">No projects match your filters.</td></tr>
            )}
            {filtered.map((p: any) => {
              const info = (p.shipping_address ?? {}) as any;
              return (
                <tr key={p.id} className="border-t border-ink/10">
                  <td className="px-3 py-2 font-mono font-semibold">{p.project_reference ?? p.order_number}</td>
                  <td className="px-3 py-2">
                    <div className="font-semibold">{p.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{p.email}</div>
                  </td>
                  <td className="px-3 py-2">{fmtDate(p.created_at)}</td>
                  <td className="px-3 py-2"><ProjectStatusBadge status={p.project_status ?? "submitted"} /></td>
                  <td className="px-3 py-2">{p.item_count}</td>
                  <td className="px-3 py-2">{fmtDate(info.completionDate)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link to="/portal-admin/projects/$id" params={{ id: p.id }}>
                      <Button size="sm" variant="outline" className="border-2 border-ink font-semibold hover:bg-yellow">Open</Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
