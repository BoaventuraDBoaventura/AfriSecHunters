-- Create payout_method enum
CREATE TYPE public.payout_method AS ENUM ('bank_transfer', 'mpesa', 'paypal');

-- Add payout fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN payout_method public.payout_method,
ADD COLUMN payout_details jsonb;

-- Create platform_transactions table
CREATE TABLE public.platform_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  pentester_id uuid NOT NULL,
  gross_amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_amount numeric NOT NULL,
  stripe_session_id text,
  stripe_payment_intent text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.platform_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_transactions
CREATE POLICY "Admins can view all transactions"
ON public.platform_transactions
FOR SELECT
USING (is_admin());

CREATE POLICY "Companies can view their transactions"
ON public.platform_transactions
FOR SELECT
USING (auth.uid() = company_id);

CREATE POLICY "Pentesters can view their transactions"
ON public.platform_transactions
FOR SELECT
USING (auth.uid() = pentester_id);

-- Index for faster queries
CREATE INDEX idx_platform_transactions_company ON public.platform_transactions(company_id);
CREATE INDEX idx_platform_transactions_pentester ON public.platform_transactions(pentester_id);
CREATE INDEX idx_platform_transactions_created ON public.platform_transactions(created_at DESC);