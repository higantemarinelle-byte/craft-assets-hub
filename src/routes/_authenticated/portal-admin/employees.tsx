import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminListStaff, adminAssignRole, adminRevokeRole } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/portal-admin/employees")({
  head: () => ({ meta: [{ title: "Employees — Admin" }, { name: "robots", content: "noindex" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const fetch = useServerFn(adminListStaff);
  const assign = useServerFn(adminAssignRole);
  const revoke = useServerFn(adminRevokeRole);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin:staff"], queryFn: () => fetch() });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "employee">("employee");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assign({ data: { email, role } });
      toast.success("Role granted");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin:staff"] });
    } catch (err: any) {
      toast.error("Failed", { description: err?.message });
    }
  };

  const remove = async (userId: string, r: "owner" | "employee") => {
    await revoke({ data: { userId, role: r } });
    qc.invalidateQueries({ queryKey: ["admin:staff"] });
  };

  return (
    <div>
      <h1 className="text-display text-3xl">Employees</h1>
      <p className="mt-1 text-sm text-muted-foreground">Only owners can manage staff. Users must sign up first, then you assign them a role by email.</p>

      <form onSubmit={add} className="mt-6 flex flex-wrap gap-2 rounded-lg border-2 border-ink bg-cream p-4">
        <Input placeholder="email@example.com" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-64 flex-1 border-2 border-ink" />
        <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border-2 border-ink bg-cream px-3 py-2 text-sm font-semibold">
          <option value="employee">Employee</option>
          <option value="owner">Owner</option>
        </select>
        <Button type="submit" className="border-2 border-ink bg-ink font-bold text-cream hover:bg-magenta hover:border-magenta">Grant role</Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border-2 border-ink bg-cream">
        <table className="w-full text-sm">
          <thead className="bg-ink text-cream">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Roles</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((u: any) => (
              <tr key={u.user_id} className="border-t border-ink/10">
                <td className="p-3">{u.full_name ?? "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {u.roles.map((r: string) => (
                      <span key={r} className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${r === "owner" ? "bg-magenta text-cream" : "bg-cyan"}`}>{r}</span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right">
                  {u.roles.map((r: string) => (
                    <Button key={r} size="sm" variant="ghost" onClick={() => remove(u.user_id, r as any)} className="text-xs">
                      Revoke {r}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">No staff yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
