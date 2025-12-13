-- Add new columns to platform_transactions for tracking pentester payments
ALTER TABLE public.platform_transactions 
ADD COLUMN IF NOT EXISTS pentester_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS pentester_paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS pentester_payment_reference text,
ADD COLUMN IF NOT EXISTS pentester_payment_notes text;

-- Create index for efficient querying of pending payments
CREATE INDEX IF NOT EXISTS idx_platform_transactions_pentester_paid 
ON public.platform_transactions (pentester_paid) 
WHERE pentester_paid = false;

-- Add policy for admins to update transactions (mark as paid)
CREATE POLICY "Admins can update transactions" 
ON public.platform_transactions 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());