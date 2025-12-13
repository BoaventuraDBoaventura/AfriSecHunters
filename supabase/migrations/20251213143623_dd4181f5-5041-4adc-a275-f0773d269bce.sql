-- Add new vulnerability types to the enum
ALTER TYPE vulnerability_type ADD VALUE IF NOT EXISTS 'info_disclosure';
ALTER TYPE vulnerability_type ADD VALUE IF NOT EXISTS 'csrf';
ALTER TYPE vulnerability_type ADD VALUE IF NOT EXISTS 'open_redirect';
ALTER TYPE vulnerability_type ADD VALUE IF NOT EXISTS 'business_logic';
ALTER TYPE vulnerability_type ADD VALUE IF NOT EXISTS 'dos';

-- Create report_status_history table
CREATE TABLE IF NOT EXISTS public.report_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  old_status report_status,
  new_status report_status NOT NULL,
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for status history
CREATE POLICY "Users can view status history of their reports"
  ON public.report_status_history
  FOR SELECT
  USING (
    report_id IN (
      SELECT r.id FROM reports r WHERE r.pentester_id = auth.uid()
    )
    OR
    report_id IN (
      SELECT r.id FROM reports r 
      JOIN programs p ON r.program_id = p.id 
      WHERE p.company_id = auth.uid()
    )
    OR
    is_admin()
  );

-- Create trigger to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_report_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.report_status_history (report_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on reports table
DROP TRIGGER IF EXISTS on_report_status_change ON public.reports;
CREATE TRIGGER on_report_status_change
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_report_status_change();

-- Create evidence storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for evidence bucket
CREATE POLICY "Users can upload evidence to their reports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'report-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Evidence is viewable by authenticated users"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'report-evidence' AND auth.role() = 'authenticated');

-- Add evidence_urls column to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS evidence_urls text[] DEFAULT '{}';