-- Allow authenticated users to read platform fee settings
CREATE POLICY "Authenticated users can read platform fee"
ON public.platform_settings
FOR SELECT
USING (setting_key IN ('platform_fee_percentage'));