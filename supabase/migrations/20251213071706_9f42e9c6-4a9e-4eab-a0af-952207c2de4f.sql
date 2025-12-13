-- Enable realtime for reports table
ALTER TABLE public.reports REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;