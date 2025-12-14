-- Add INSERT policy for companies to create transactions
CREATE POLICY "Companies can insert transactions for their reports"
ON public.platform_transactions
FOR INSERT
WITH CHECK (auth.uid() = company_id);