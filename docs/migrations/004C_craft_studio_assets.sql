-- Engineering Task 004C — Craft Studio Asset Manager foundation.
--
-- Apply this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Additive migration: creates asset categories, folders, assets, usage
-- tracking + storage bucket policies. Nothing existing is dropped.

-- ---------------------------------------------------------------------------
-- Owner allowlist helper (SECURITY DEFINER — bypasses RLS to read auth.users).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_craft_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'owner'
    WHERE u.id = _user_id
      AND LOWER(u.email) IN ('higantemarinelle@gmail.com', 'mhigante@gmail.com')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_craft_owner(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- craft_asset_categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.craft_asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.craft_asset_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.craft_asset_categories TO authenticated;
GRANT ALL ON public.craft_asset_categories TO service_role;

ALTER TABLE public.craft_asset_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "asset_categories_public_read" ON public.craft_asset_categories;
CREATE POLICY "asset_categories_public_read" ON public.craft_asset_categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "asset_categories_owner_write" ON public.craft_asset_categories;
CREATE POLICY "asset_categories_owner_write" ON public.craft_asset_categories
  FOR ALL TO authenticated
  USING (public.is_craft_owner(auth.uid()))
  WITH CHECK (public.is_craft_owner(auth.uid()));

INSERT INTO public.craft_asset_categories (name, slug, sort_order) VALUES
  ('Brand Assets',        'brand-assets',        10),
  ('Logos',               'logos',               20),
  ('Hero Images',         'hero-images',         30),
  ('Homepage Images',     'homepage-images',     40),
  ('Gallery',             'gallery',             50),
  ('Campaign Assets',     'campaign-assets',     60),
  ('Icons',               'icons',               70),
  ('Product Collections', 'product-collections', 80),
  ('General',             'general',             90)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- craft_asset_folders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.craft_asset_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.craft_asset_folders(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_craft_asset_folders_parent ON public.craft_asset_folders (parent_id);

GRANT SELECT ON public.craft_asset_folders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.craft_asset_folders TO authenticated;
GRANT ALL ON public.craft_asset_folders TO service_role;

ALTER TABLE public.craft_asset_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asset_folders_read" ON public.craft_asset_folders;
CREATE POLICY "asset_folders_read" ON public.craft_asset_folders
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "asset_folders_owner_write" ON public.craft_asset_folders;
CREATE POLICY "asset_folders_owner_write" ON public.craft_asset_folders
  FOR ALL TO authenticated
  USING (public.is_craft_owner(auth.uid()))
  WITH CHECK (public.is_craft_owner(auth.uid()));

-- ---------------------------------------------------------------------------
-- craft_assets
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.craft_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  category_id UUID REFERENCES public.craft_asset_categories(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.craft_asset_folders(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_craft_assets_status_created ON public.craft_assets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_craft_assets_category ON public.craft_assets (category_id);
CREATE INDEX IF NOT EXISTS idx_craft_assets_folder ON public.craft_assets (folder_id);
CREATE INDEX IF NOT EXISTS idx_craft_assets_tags ON public.craft_assets USING GIN (tags);

GRANT SELECT ON public.craft_assets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.craft_assets TO authenticated;
GRANT ALL ON public.craft_assets TO service_role;

ALTER TABLE public.craft_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "craft_assets_public_read_active" ON public.craft_assets;
CREATE POLICY "craft_assets_public_read_active" ON public.craft_assets
  FOR SELECT TO anon, authenticated USING (status = 'active');
DROP POLICY IF EXISTS "craft_assets_owner_read_all" ON public.craft_assets;
CREATE POLICY "craft_assets_owner_read_all" ON public.craft_assets
  FOR SELECT TO authenticated USING (public.is_craft_owner(auth.uid()));
DROP POLICY IF EXISTS "craft_assets_owner_write" ON public.craft_assets;
CREATE POLICY "craft_assets_owner_write" ON public.craft_assets
  FOR ALL TO authenticated
  USING (public.is_craft_owner(auth.uid()))
  WITH CHECK (public.is_craft_owner(auth.uid()));

-- ---------------------------------------------------------------------------
-- craft_asset_usages
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.craft_asset_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.craft_assets(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id TEXT,
  field_path TEXT NOT NULL,
  usage_scope TEXT NOT NULL CHECK (usage_scope IN ('draft','published')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_craft_asset_usages
  ON public.craft_asset_usages (asset_id, source_type, COALESCE(source_id, ''), field_path, usage_scope);
CREATE INDEX IF NOT EXISTS idx_craft_asset_usages_asset ON public.craft_asset_usages (asset_id);
CREATE INDEX IF NOT EXISTS idx_craft_asset_usages_scope ON public.craft_asset_usages (usage_scope, source_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.craft_asset_usages TO authenticated;
GRANT ALL ON public.craft_asset_usages TO service_role;

ALTER TABLE public.craft_asset_usages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "asset_usages_owner_only" ON public.craft_asset_usages;
CREATE POLICY "asset_usages_owner_only" ON public.craft_asset_usages
  FOR ALL TO authenticated
  USING (public.is_craft_owner(auth.uid()))
  WITH CHECK (public.is_craft_owner(auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage bucket + policies.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'craft-studio-assets',
  'craft-studio-assets',
  true,
  15728640,
  ARRAY['image/png','image/jpeg','image/webp','image/gif','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "craft_assets_public_read_storage" ON storage.objects;
CREATE POLICY "craft_assets_public_read_storage" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'craft-studio-assets');

DROP POLICY IF EXISTS "craft_assets_owner_insert_storage" ON storage.objects;
CREATE POLICY "craft_assets_owner_insert_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'craft-studio-assets' AND public.is_craft_owner(auth.uid()));

DROP POLICY IF EXISTS "craft_assets_owner_update_storage" ON storage.objects;
CREATE POLICY "craft_assets_owner_update_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'craft-studio-assets' AND public.is_craft_owner(auth.uid()))
  WITH CHECK (bucket_id = 'craft-studio-assets' AND public.is_craft_owner(auth.uid()));

DROP POLICY IF EXISTS "craft_assets_owner_delete_storage" ON storage.objects;
CREATE POLICY "craft_assets_owner_delete_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'craft-studio-assets' AND public.is_craft_owner(auth.uid()));