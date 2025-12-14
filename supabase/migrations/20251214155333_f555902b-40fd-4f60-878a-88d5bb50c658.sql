-- Create rank_certificates table
CREATE TABLE public.rank_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pentester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rank_title TEXT NOT NULL,
  points_at_issue INTEGER NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_code TEXT NOT NULL UNIQUE
);

-- Enable RLS
ALTER TABLE public.rank_certificates ENABLE ROW LEVEL SECURITY;

-- Public can view certificates (for verification)
CREATE POLICY "Certificates are publicly viewable"
ON public.rank_certificates
FOR SELECT
USING (true);

-- System can insert certificates (via trigger)
CREATE POLICY "System can insert certificates"
ON public.rank_certificates
FOR INSERT
WITH CHECK (true);

-- Create function to generate certificate code
CREATE OR REPLACE FUNCTION public.generate_certificate_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  year_part TEXT;
  random_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  code := 'AFSH-' || year_part || '-' || random_part;
  RETURN code;
END;
$$;

-- Create function to issue certificate on rank change
CREATE OR REPLACE FUNCTION public.issue_rank_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  eligible_ranks TEXT[] := ARRAY['Apprentice', 'Hunter', 'Senior Hunter', 'Expert Hunter', 'Master Hunter', 'Elite Hunter'];
  cert_exists BOOLEAN;
BEGIN
  -- Only process if rank_title changed and new rank is eligible
  IF (OLD.rank_title IS DISTINCT FROM NEW.rank_title) AND (NEW.rank_title = ANY(eligible_ranks)) THEN
    -- Check if certificate already exists for this rank
    SELECT EXISTS (
      SELECT 1 FROM public.rank_certificates
      WHERE pentester_id = NEW.id AND rank_title = NEW.rank_title
    ) INTO cert_exists;
    
    -- Issue new certificate if not exists
    IF NOT cert_exists THEN
      INSERT INTO public.rank_certificates (pentester_id, rank_title, points_at_issue, certificate_code)
      VALUES (NEW.id, NEW.rank_title, NEW.total_points, public.generate_certificate_code());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
CREATE TRIGGER on_rank_change_issue_certificate
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.rank_title IS DISTINCT FROM NEW.rank_title)
  EXECUTE FUNCTION public.issue_rank_certificate();

-- Issue certificates retroactively for existing pentesters with eligible ranks
DO $$
DECLARE
  eligible_ranks TEXT[] := ARRAY['Apprentice', 'Hunter', 'Senior Hunter', 'Expert Hunter', 'Master Hunter', 'Elite Hunter'];
  p RECORD;
BEGIN
  FOR p IN 
    SELECT id, rank_title, total_points 
    FROM public.profiles 
    WHERE role = 'pentester' AND rank_title = ANY(eligible_ranks)
  LOOP
    -- Check if certificate already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.rank_certificates
      WHERE pentester_id = p.id AND rank_title = p.rank_title
    ) THEN
      INSERT INTO public.rank_certificates (pentester_id, rank_title, points_at_issue, certificate_code)
      VALUES (p.id, p.rank_title, p.total_points, public.generate_certificate_code());
    END IF;
  END LOOP;
END;
$$;