
CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

REVOKE EXECUTE ON FUNCTION public.log_project_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_project_reference() FROM PUBLIC, anon, authenticated;
