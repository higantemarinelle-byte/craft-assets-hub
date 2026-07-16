
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO anon, authenticated;
