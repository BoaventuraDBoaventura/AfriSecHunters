-- Insert platform phone number setting if it doesn't exist
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
  'platform_mpesa_number',
  '"258840000000"',
  'Número M-Pesa/E-Mola onde as comissões da plataforma são recebidas'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create a function to get the platform mpesa number
CREATE OR REPLACE FUNCTION public.get_platform_mpesa_number()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT TRIM(BOTH '"' FROM (setting_value::text))
  FROM public.platform_settings
  WHERE setting_key = 'platform_mpesa_number'
  LIMIT 1;
$$;