import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminListQuoteRequests } from "@/lib/quotes/quotes.functions";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/portal-admin/quote-requests")({
  head: () => ({ meta: [{ title: "Quote Requests — Craft OS" }, { name: "robots", content: "noindex" }] }),
  component: QuoteRequestsList,
});

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-amber-100 text-amber-700",
  quoted: "bg-violet-100 text-violet-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
  converted: "bg-slate-800 text-white",
};

function QuoteRequestsList() {
  const list = useServerFn(adminListQuoteRequests);
  const { data = [], isLoading } = useQuery({
    queryKey: ["quote-requests", "admin", "list"],
    queryFn: () => list(),
  });
  const rows = data as any[];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">Quote Requests</h1>
        <p className="mt-1 text-sm text-slate-500">Gang sheet quote requests submitted from the public builder.</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Sheet</th>
              <th className="p-3 text-right">Designs</th>
              <th className="p-3 text-right">Fill</th>
              <th className="p-3 text-right">Estimate</th>
              <th className="p-3 text-right">Quoted</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-left">Submitted</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={10} className="p-6 text-center text-slate-500">Loading…</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={10} className="p-6 text-center text-slate-500">No quote requests yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{r.reference}</td>
                <td className="p-3">
                  <div className="font-medium">{r.customer_name}</div>
                  <div className="text-xs text-slate-500">{r.customer_email}</div>
                </td>
                <td className="p-3">{r.sheet_name}</td>
                <td className="p-3 text-right">{r.design_count}</td>
                <td className="p-3 text-right">{Number(r.fill_percent).toFixed(0)}%</td>
                <td className="p-3 text-right">{money(Number(r.estimated_total ?? 0), r.currency)}</td>
                <td className="p-3 text-right">{r.quoted_total != null ? money(Number(r.quoted_total), r.currency) : "—"}</td>
                <td className="p-3 text-center">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] ?? "bg-slate-100"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3 text-right">
                  <Link to="/portal-admin/quote-requests/$id" params={{ id: r.id }} className="text-magenta font-semibold hover:underline">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}