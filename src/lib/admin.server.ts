// Server-only helpers for the Craft OS admin server functions.
// Kept out of *.functions.ts so the server-function splitter never strips
// these runtime siblings from the server bundle.
import { requireStaffAccess, requireOwnerAccess } from "@/lib/permissions.server";

/**
 * Verify the caller is staff (or owner when `ownerOnly`) and return the
 * centralized Supabase admin client.
 */
export async function getStaffAdmin(ctx: any, ownerOnly = false) {
  const access = ownerOnly
    ? await requireOwnerAccess(ctx)
    : await requireStaffAccess(ctx);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { admin: supabaseAdmin, roles: access.roles };
}
