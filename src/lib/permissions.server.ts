// Centralized server-side permission helpers for Craft Studio + future
// owner-only modules. Do NOT scatter email or role checks across routes,
// components, or server functions — always go through these helpers.
//
// Usage inside a createServerFn handler (already wrapped with
// requireSupabaseAuth middleware):
//
//   .handler(async ({ context }) => {
//     await requireOwnerAccess(context);
//     // ... privileged work ...
//   });

import { isOwnerUser, type OwnerCapability, canAccessOwnerCapability } from "./permissions";

export class ForbiddenError extends Error {
  status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

type AuthContext = {
  supabase: any;
  userId: string;
  claims: Record<string, unknown> & { email?: string; sub?: string };
};

async function loadRoles(ctx: AuthContext): Promise<string[]> {
  // context.supabase runs as the signed-in user, so RLS on user_roles
  // must allow a user to read their own rows. That's the standard shape
  // shipped with the user-roles knowledge doc.
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { role: string }) => r.role);
}

function emailFromContext(ctx: AuthContext): string | null {
  const raw = (ctx.claims?.email as string | undefined) ?? null;
  return raw ? raw.trim().toLowerCase() : null;
}

/** Any staff (owner OR employee). */
export async function requireStaffAccess(ctx: AuthContext): Promise<{ roles: string[]; email: string | null }> {
  const roles = await loadRoles(ctx);
  const email = emailFromContext(ctx);
  const isStaff = roles.includes("owner") || roles.includes("employee");
  if (!isStaff) throw new ForbiddenError("Staff access required");
  return { roles, email };
}

/** Craft Studio owner: DB role `owner` AND email in the allowlist. */
export async function requireOwnerAccess(ctx: AuthContext): Promise<{ roles: string[]; email: string }> {
  const roles = await loadRoles(ctx);
  const email = emailFromContext(ctx);
  if (!roles.includes("owner")) throw new ForbiddenError("Owner access required");
  if (!email || !isOwnerUser({ email })) throw new ForbiddenError("Owner access required");
  return { roles, email };
}

/** Gate a specific owner capability. Extends requireOwnerAccess. */
export async function requireOwnerCapability(
  ctx: AuthContext,
  capability: OwnerCapability,
): Promise<{ roles: string[]; email: string }> {
  const result = await requireOwnerAccess(ctx);
  if (!canAccessOwnerCapability({ email: result.email }, capability)) {
    throw new ForbiddenError(`Owner capability '${capability}' not permitted`);
  }
  return result;
}