-- Quote requests table
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  notes text,
  sheet_code text NOT NULL,
  sheet_name text NOT NULL,
  sheet_width_inches numeric(6,2),
  sheet_height_inches numeric(6,2),
  design_count integer NOT NULL DEFAULT 0,
  fill_percent numeric(5,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  estimated_total numeric(10,2) NOT NULL DEFAULT 0,
  quoted_total numeric(10,2),
  quote_notes text,
  pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  designs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','reviewing','quoted','approved','declined','converted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_requests_read_own
  ON public.quote_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY quote_requests_staff_read
  ON public.quote_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'employee'));

-- Reference sequence + trigger
CREATE SEQUENCE IF NOT EXISTS public.quote_reference_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_quote_reference()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reference IS NULL THEN
    NEW.reference := 'QR-P' || lpad(nextval('public.quote_reference_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_assign_quote_reference
  BEFORE INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.assign_quote_reference();

CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX quote_requests_status_idx ON public.quote_requests (status, created_at DESC);
CREATE INDEX quote_requests_user_idx ON public.quote_requests (user_id);
