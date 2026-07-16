
ALTER TABLE public.craft_assets ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS craft_assets_public_read_active ON public.craft_assets;

CREATE POLICY craft_assets_public_read_active
  ON public.craft_assets
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active' AND is_public = true);
