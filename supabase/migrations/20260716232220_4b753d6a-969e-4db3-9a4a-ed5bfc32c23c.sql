-- Reusable role check (matches user_roles knowledge doc)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Gang sheet pricing rules
CREATE TABLE IF NOT EXISTS public.gang_sheet_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  width_inches NUMERIC(10,2),
  height_inches NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  per_design_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  fill_adjustment_type TEXT NOT NULL DEFAULT 'none',
  fill_threshold_percent NUMERIC(5,2),
  fill_adjustment_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  effective_from TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT gsp_fill_type_ck CHECK (
    fill_adjustment_type IN ('none','flat_fee','flat_discount','percentage_discount','proportional_fee')
  ),
  CONSTRAINT gsp_nonneg_ck CHECK (
    base_price >= 0
    AND per_design_fee >= 0
    AND fill_adjustment_value >= 0
    AND minimum_total >= 0
    AND (width_inches IS NULL OR width_inches >= 0)
    AND (height_inches IS NULL OR height_inches >= 0)
    AND (fill_threshold_percent IS NULL OR (fill_threshold_percent >= 0 AND fill_threshold_percent <= 100))
  )
);

GRANT SELECT ON public.gang_sheet_pricing_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gang_sheet_pricing_rules TO authenticated;
GRANT ALL ON public.gang_sheet_pricing_rules TO service_role;

ALTER TABLE public.gang_sheet_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing rules"
ON public.gang_sheet_pricing_rules
FOR SELECT
USING (is_active = true);

CREATE POLICY "Staff can view all pricing rules"
ON public.gang_sheet_pricing_rules
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'employee'::public.app_role)
);

CREATE POLICY "Staff can create pricing rules"
ON public.gang_sheet_pricing_rules
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'employee'::public.app_role)
);

CREATE POLICY "Staff can update pricing rules"
ON public.gang_sheet_pricing_rules
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'employee'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'employee'::public.app_role)
);

CREATE POLICY "Staff can delete pricing rules"
ON public.gang_sheet_pricing_rules
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'owner'::public.app_role)
  OR public.has_role(auth.uid(), 'employee'::public.app_role)
);

DROP TRIGGER IF EXISTS gang_sheet_pricing_rules_updated_at ON public.gang_sheet_pricing_rules;
CREATE TRIGGER gang_sheet_pricing_rules_updated_at
  BEFORE UPDATE ON public.gang_sheet_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.gang_sheet_pricing_rules
  (code, name, width_inches, height_inches, currency, base_price, per_design_fee,
   fill_adjustment_type, fill_adjustment_value, minimum_total, is_active, sort_order)
VALUES
  ('sheet-12x12', '12x12', 12, 12, 'USD', 12, 2, 'proportional_fee', 8, 0, true, 10),
  ('sheet-22x24', '22x24', 22, 24, 'USD', 32, 2, 'proportional_fee', 8, 0, true, 20),
  ('sheet-22x36', '22x36', 22, 36, 'USD', 45, 2, 'proportional_fee', 8, 0, true, 30),
  ('sheet-22x60', '22x60', 22, 60, 'USD', 72, 2, 'proportional_fee', 8, 0, true, 40)
ON CONFLICT (code) DO NOTHING;