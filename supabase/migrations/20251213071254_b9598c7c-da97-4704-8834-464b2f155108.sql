-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add table to realtime publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;