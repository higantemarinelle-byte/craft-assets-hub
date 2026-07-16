
-- 1) theme_settings: restrict public read; server functions use service role
DROP POLICY IF EXISTS "public can read published theme" ON public.theme_settings;
CREATE POLICY "staff can read theme" ON public.theme_settings
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- 2) craft_asset_folders: restrict SELECT to owners only
DROP POLICY IF EXISTS "asset_folders_read" ON public.craft_asset_folders;
CREATE POLICY "asset_folders_owner_read" ON public.craft_asset_folders
  FOR SELECT TO authenticated USING (public.is_craft_owner(auth.uid()));
REVOKE SELECT ON public.craft_asset_folders FROM anon;

-- 3) SECURITY DEFINER functions: revoke broad EXECUTE
REVOKE EXECUTE ON FUNCTION public.is_craft_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_project_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_project_reference() FROM PUBLIC, anon, authenticated;

-- 4) storage.objects: remove broad listing policy on the public bucket.
-- Public bucket URLs still serve files without RLS; this only prevents listing.
DROP POLICY IF EXISTS "craft_assets_public_read_storage" ON storage.objects;
CREATE POLICY "craft_assets_owner_read_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'craft-studio-assets' AND public.is_craft_owner(auth.uid()));
