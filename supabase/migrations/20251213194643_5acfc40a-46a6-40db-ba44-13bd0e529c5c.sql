-- Add 'emola' to payout_method enum
ALTER TYPE payout_method ADD VALUE IF NOT EXISTS 'emola';

-- Add GibaPay tracking columns to platform_transactions
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS gibrapay_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS gibrapay_pentester_tx_id TEXT,
ADD COLUMN IF NOT EXISTS gibrapay_platform_tx_id TEXT,
ADD COLUMN IF NOT EXISTS gibrapay_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gibrapay_error TEXT,
ADD COLUMN IF NOT EXISTS payout_type TEXT DEFAULT 'manual';

-- Add index for GibaPay status queries
CREATE INDEX IF NOT EXISTS idx_platform_transactions_gibrapay_status 
ON public.platform_transactions(gibrapay_status) 
WHERE gibrapay_status IS NOT NULL;