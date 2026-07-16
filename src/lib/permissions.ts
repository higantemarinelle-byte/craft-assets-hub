// Centralized permission helpers. Future phases will replace email-allowlist
// checks with proper role/permission tables.
import type { User } from "@supabase/supabase-js";

export const OWNER_EMAILS = [
  "higantemarinelle@gmail.com",
  "mhigante@gmail.com",
] as const;

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isOwnerUser(user: Pick<User, "email"> | null | undefined): boolean {
  const email = normalizeEmail(user?.email);
  return !!email && (OWNER_EMAILS as readonly string[]).includes(email);
}

export function isEmployeeUser(roles: string[] | null | undefined): boolean {
  return !!roles?.includes("employee");
}

export function isCustomerUser(roles: string[] | null | undefined): boolean {
  if (!roles || roles.length === 0) return true;
  return roles.includes("customer") && !roles.includes("owner") && !roles.includes("employee");
}

// Gated capabilities for Craft Studio and future owner-only modules.
export type OwnerCapability =
  | "craft_studio"
  | "publishing"
  | "theme_configuration"
  | "media_library"
  | "ai_features";

export function canAccessOwnerCapability(
  user: Pick<User, "email"> | null | undefined,
  _capability: OwnerCapability,
): boolean {
  return isOwnerUser(user);
}
