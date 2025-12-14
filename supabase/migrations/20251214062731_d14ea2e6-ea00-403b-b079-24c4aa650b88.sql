-- Add new platform setting for pentester deduction percentage (stays in GibaPay)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
  'pentester_deduction_percentage',
  '20',
  'Percentagem deduzida do valor do pentester que fica no saldo GibaPay'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create a function to get pentester deduction percentage
CREATE OR REPLACE FUNCTION public.get_pentester_deduction()
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (setting_value::text)::numeric
  FROM public.platform_settings
  WHERE setting_key = 'pentester_deduction_percentage'
  LIMIT 1;
$$;