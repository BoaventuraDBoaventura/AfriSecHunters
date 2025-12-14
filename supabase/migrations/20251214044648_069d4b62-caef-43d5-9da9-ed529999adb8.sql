-- Create platform_settings table to store configurable settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admins can view settings"
ON public.platform_settings
FOR SELECT
USING (is_admin());

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.platform_settings
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.platform_settings
FOR INSERT
WITH CHECK (is_admin());

-- Insert default platform fee (10%)
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES ('platform_fee_percentage', '10', 'Taxa da plataforma em percentagem (%)');

-- Create a function to get platform fee (accessible by edge functions)
CREATE OR REPLACE FUNCTION public.get_platform_fee()
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (setting_value::text)::numeric
  FROM public.platform_settings
  WHERE setting_key = 'platform_fee_percentage'
  LIMIT 1;
$$;