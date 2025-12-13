-- Add is_archived column to programs table
ALTER TABLE public.programs 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false;

-- Add index for better query performance
CREATE INDEX idx_programs_is_archived ON public.programs(is_archived);

-- Update RLS policy to exclude archived programs from public view (hunters can't see archived)
DROP POLICY IF EXISTS "Active programs are viewable by everyone" ON public.programs;

CREATE POLICY "Active non-archived programs are viewable by everyone" 
ON public.programs 
FOR SELECT 
USING ((is_active = true AND is_archived = false) OR (company_id = auth.uid()));