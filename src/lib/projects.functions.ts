import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import { PROJECT_STATUSES } from "@/lib/project-status";

function serviceClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function assertStaff(ctx: any) {
  const admin = serviceClient();
  const { data } = await admin.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("owner") && !roles.includes("employee")) throw new Error("Forbidden");
  return admin;
}

const PROJECT_LIST_COLS =
  "id, order_number, project_reference, project_status, status, created_at, updated_at, full_name, email, total, shipping_address, order_items(id, quantity)";

const PROJECT_DETAIL_COLS =
  "id, order_number, project_reference, project_status, status, created_at, updated_at, full_name, email, user_id, total, subtotal, shipping_address, internal_notes, order_items(*)";

// ============== CUSTOMER ==============

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(PROJECT_LIST_COLS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase
      .from("orders")
      .select(PROJECT_DETAIL_COLS)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const { data: history } = await context.supabase
      .from("project_status_history" as any)
      .select("id, status, note, created_at")
      .eq("order_id", data.id)
      .order("created_at", { ascending: true });

    return { project, history: history ?? [] };
  });

// ============== ADMIN ==============

export const adminListProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertStaff(context);
    const { data, error } = await admin
      .from("orders")
      .select(PROJECT_LIST_COLS)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((o: any) => ({
      ...o,
      item_count: (o.order_items ?? []).reduce((s: number, i: any) => s + (i.quantity ?? 0), 0),
    }));
  });

export const adminGetProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context);
    const { data: project, error } = await admin
      .from("orders")
      .select(PROJECT_DETAIL_COLS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found");

    const { data: history } = await admin
      .from("project_status_history" as any)
      .select("id, status, note, created_at, changed_by")
      .eq("order_id", data.id)
      .order("created_at", { ascending: true });

    return { project, history: history ?? [] };
  });

const statusEnum = z.enum(PROJECT_STATUSES as [string, ...string[]]);

export const adminUpdateProjectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string; note?: string }) =>
    z.object({ id: z.string().uuid(), status: statusEnum, note: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context);
    // Update the project status (trigger will log the change with auth.uid())
    const { error } = await admin
      .from("orders")
      .update({ project_status: data.status } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.note && data.note.trim()) {
      await admin.from("project_status_history" as any).insert({
        order_id: data.id,
        status: data.status,
        note: data.note.trim(),
        changed_by: context.userId,
      });
    }
    return { ok: true };
  });

export const adminUpdateProjectInternalNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; internal_notes: string }) =>
    z.object({ id: z.string().uuid(), internal_notes: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context);
    const { error } = await admin
      .from("orders")
      .update({ internal_notes: data.internal_notes } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
