-- Fix platform fee value (remove quotes, store as number)
UPDATE public.platform_settings 
SET setting_value = '30'::jsonb
WHERE setting_key = 'platform_fee_percentage';