-- Add deposit_status column to track the deposit confirmation flow
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'confirmed';

-- Add deposit_confirmed_at timestamp
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS deposit_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add deposit_confirmed_by to track who confirmed
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS deposit_confirmed_by UUID;

-- Add wallet_type for the deposit method
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS wallet_type TEXT;

-- Add phone_number used for the transaction
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update existing records to be confirmed (they already went through the old flow)
UPDATE public.platform_transactions 
SET deposit_status = 'confirmed' 
WHERE deposit_status IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.platform_transactions.deposit_status IS 'pending = waiting for company deposit confirmation, confirmed = deposit received by admin';