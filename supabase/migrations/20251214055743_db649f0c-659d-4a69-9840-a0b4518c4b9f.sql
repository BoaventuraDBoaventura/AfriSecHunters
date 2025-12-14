-- Fix platform phone number value (remove quotes, store as plain string in jsonb)
UPDATE public.platform_settings 
SET setting_value = '"258869464474"'::jsonb
WHERE setting_key = 'platform_mpesa_number';

-- Actually we need to store just the number without extra quotes
UPDATE public.platform_settings 
SET setting_value = to_jsonb('258869464474'::text)
WHERE setting_key = 'platform_mpesa_number';