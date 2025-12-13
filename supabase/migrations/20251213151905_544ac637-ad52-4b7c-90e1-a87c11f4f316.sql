-- Create program change history table
CREATE TABLE public.program_change_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  change_type text NOT NULL, -- 'created', 'updated', 'archived', 'restored', 'deleted'
  changes jsonb, -- stores the diff of what changed
  old_values jsonb, -- previous values
  new_values jsonb, -- new values
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_program_change_history_program_id ON public.program_change_history(program_id);
CREATE INDEX idx_program_change_history_created_at ON public.program_change_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.program_change_history ENABLE ROW LEVEL SECURITY;

-- Companies can view history of their own programs
CREATE POLICY "Companies can view their program history"
ON public.program_change_history
FOR SELECT
USING (
  program_id IN (
    SELECT id FROM public.programs WHERE company_id = auth.uid()
  )
);

-- Admins can view all history
CREATE POLICY "Admins can view all program history"
ON public.program_change_history
FOR SELECT
USING (is_admin());

-- Create function to log program changes
CREATE OR REPLACE FUNCTION public.log_program_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  change_type_val text;
  changes_obj jsonb;
BEGIN
  -- Determine change type
  IF TG_OP = 'INSERT' THEN
    change_type_val := 'created';
    
    INSERT INTO public.program_change_history (program_id, changed_by, change_type, new_values)
    VALUES (NEW.id, auth.uid(), change_type_val, to_jsonb(NEW));
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine specific change type
    IF OLD.is_archived = false AND NEW.is_archived = true THEN
      change_type_val := 'archived';
    ELSIF OLD.is_archived = true AND NEW.is_archived = false THEN
      change_type_val := 'restored';
    ELSE
      change_type_val := 'updated';
    END IF;
    
    -- Build changes object showing what changed
    changes_obj := '{}'::jsonb;
    
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      changes_obj := changes_obj || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
    END IF;
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      changes_obj := changes_obj || jsonb_build_object('description', jsonb_build_object('old', OLD.description, 'new', NEW.description));
    END IF;
    IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
      changes_obj := changes_obj || jsonb_build_object('is_active', jsonb_build_object('old', OLD.is_active, 'new', NEW.is_active));
    END IF;
    IF OLD.is_archived IS DISTINCT FROM NEW.is_archived THEN
      changes_obj := changes_obj || jsonb_build_object('is_archived', jsonb_build_object('old', OLD.is_archived, 'new', NEW.is_archived));
    END IF;
    IF OLD.reward_low IS DISTINCT FROM NEW.reward_low THEN
      changes_obj := changes_obj || jsonb_build_object('reward_low', jsonb_build_object('old', OLD.reward_low, 'new', NEW.reward_low));
    END IF;
    IF OLD.reward_medium IS DISTINCT FROM NEW.reward_medium THEN
      changes_obj := changes_obj || jsonb_build_object('reward_medium', jsonb_build_object('old', OLD.reward_medium, 'new', NEW.reward_medium));
    END IF;
    IF OLD.reward_high IS DISTINCT FROM NEW.reward_high THEN
      changes_obj := changes_obj || jsonb_build_object('reward_high', jsonb_build_object('old', OLD.reward_high, 'new', NEW.reward_high));
    END IF;
    IF OLD.reward_critical IS DISTINCT FROM NEW.reward_critical THEN
      changes_obj := changes_obj || jsonb_build_object('reward_critical', jsonb_build_object('old', OLD.reward_critical, 'new', NEW.reward_critical));
    END IF;
    IF OLD.scope IS DISTINCT FROM NEW.scope THEN
      changes_obj := changes_obj || jsonb_build_object('scope', jsonb_build_object('old', OLD.scope, 'new', NEW.scope));
    END IF;
    IF OLD.out_of_scope IS DISTINCT FROM NEW.out_of_scope THEN
      changes_obj := changes_obj || jsonb_build_object('out_of_scope', jsonb_build_object('old', OLD.out_of_scope, 'new', NEW.out_of_scope));
    END IF;
    IF OLD.rules IS DISTINCT FROM NEW.rules THEN
      changes_obj := changes_obj || jsonb_build_object('rules', 'modified');
    END IF;
    
    INSERT INTO public.program_change_history (program_id, changed_by, change_type, changes, old_values, new_values)
    VALUES (NEW.id, auth.uid(), change_type_val, changes_obj, to_jsonb(OLD), to_jsonb(NEW));
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for program changes
CREATE TRIGGER trigger_log_program_changes
AFTER INSERT OR UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.log_program_changes();