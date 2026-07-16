
-- ============================================================
-- Move SECURITY DEFINER helper functions out of the API-exposed
-- public schema so they cannot be invoked directly via PostgREST
-- by anon or authenticated. They remain callable from RLS
-- policies (dependencies are tracked by OID, so policies follow
-- the moved functions transparently).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION public.is_craft_owner(uuid) SET SCHEMA private;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;

-- Explicit EXECUTE grants on the moved functions so RLS policies
-- keep working when evaluated as anon / authenticated. The linter
-- only flags SECURITY DEFINER functions in API-exposed schemas.
REVOKE ALL ON FUNCTION private.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_craft_owner(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_craft_owner(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- Lock down trigger-only SECURITY DEFINER functions. Triggers run
-- with the trigger owner's rights, so revoking EXECUTE from anon /
-- authenticated does not affect trigger execution.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_project_status_change() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- Discount codes: remove anonymous / authenticated read access.
-- Codes are validated server-side through a SECURITY DEFINER
-- function that only returns whether a supplied code is valid,
-- never enumerates the full table.
-- ============================================================

DROP POLICY IF EXISTS "Public read active codes" ON public.discount_codes;

CREATE OR REPLACE FUNCTION private.validate_discount_code(_code text)
RETURNS TABLE (
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  valid boolean,
  reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.discount_codes%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.discount_codes WHERE lower(code) = lower(_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, _code, NULL::text, NULL::numeric, false, 'not_found'::text;
    RETURN;
  END IF;
  IF NOT r.is_active THEN
    RETURN QUERY SELECT r.id, r.code, r.discount_type, r.discount_value, false, 'inactive'::text;
    RETURN;
  END IF;
  IF r.expires_at IS NOT NULL AND r.expires_at < now() THEN
    RETURN QUERY SELECT r.id, r.code, r.discount_type, r.discount_value, false, 'expired'::text;
    RETURN;
  END IF;
  IF r.max_uses IS NOT NULL AND COALESCE(r.times_used, 0) >= r.max_uses THEN
    RETURN QUERY SELECT r.id, r.code, r.discount_type, r.discount_value, false, 'exhausted'::text;
    RETURN;
  END IF;
  RETURN QUERY SELECT r.id, r.code, r.discount_type, r.discount_value, true, NULL::text;
END $$;

REVOKE ALL ON FUNCTION private.validate_discount_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.validate_discount_code(text) TO anon, authenticated;
