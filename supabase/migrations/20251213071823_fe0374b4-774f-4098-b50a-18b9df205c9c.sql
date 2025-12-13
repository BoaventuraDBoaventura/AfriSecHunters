-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true);

-- Allow authenticated users to upload attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- Allow authenticated users to view attachments
CREATE POLICY "Chat attachments are viewable by authenticated users"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- Add attachment_url column to messages table
ALTER TABLE public.messages
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_type TEXT;