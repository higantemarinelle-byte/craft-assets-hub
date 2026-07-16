
-- 1. Project status enum
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'submitted','craft_review','waiting_for_customer','quote_ready','approved',
    'in_production','quality_check','ready_for_pickup','shipped','completed','archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Sequence for project reference
CREATE SEQUENCE IF NOT EXISTS public.project_reference_seq START 1;

-- 3. Add columns to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS project_status public.project_status NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS project_reference text UNIQUE,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- 4. Auto-assign project_reference on insert
CREATE OR REPLACE FUNCTION public.assign_project_reference()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.project_reference IS NULL THEN
    NEW.project_reference := 'CC-P' || lpad(nextval('public.project_reference_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assign_project_reference ON public.orders;
CREATE TRIGGER trg_assign_project_reference
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.assign_project_reference();

-- Backfill for existing rows
UPDATE public.orders
   SET project_reference = 'CC-P' || lpad(nextval('public.project_reference_seq')::text, 6, '0')
 WHERE project_reference IS NULL;

-- 5. Status history table
CREATE TABLE IF NOT EXISTS public.project_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.project_status NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_status_history_order ON public.project_status_history(order_id, created_at DESC);

GRANT SELECT, INSERT ON public.project_status_history TO authenticated;
GRANT ALL ON public.project_status_history TO service_role;

ALTER TABLE public.project_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own project history" ON public.project_status_history;
CREATE POLICY "Users read own project history" ON public.project_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_staff(auth.uid())))
  );

DROP POLICY IF EXISTS "Staff insert project history" ON public.project_status_history;
CREATE POLICY "Staff insert project history" ON public.project_status_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

-- 6. Auto-log status changes
CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_status_history(order_id, status, changed_by, note)
      VALUES (NEW.id, NEW.project_status, NEW.user_id, 'Project submitted');
  ELSIF NEW.project_status IS DISTINCT FROM OLD.project_status THEN
    INSERT INTO public.project_status_history(order_id, status, changed_by)
      VALUES (NEW.id, NEW.project_status, auth.uid());
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_project_status_insert ON public.orders;
CREATE TRIGGER trg_log_project_status_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_project_status_change();

DROP TRIGGER IF EXISTS trg_log_project_status_update ON public.orders;
CREATE TRIGGER trg_log_project_status_update
  AFTER UPDATE OF project_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_project_status_change();

-- Backfill history for existing orders
INSERT INTO public.project_status_history(order_id, status, changed_by, note, created_at)
SELECT o.id, o.project_status, o.user_id, 'Backfilled from existing order', o.created_at
  FROM public.orders o
 WHERE NOT EXISTS (SELECT 1 FROM public.project_status_history h WHERE h.order_id = o.id);
