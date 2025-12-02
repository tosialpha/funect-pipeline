-- Add screenshot_url column to todos table for optional screenshot attachments
ALTER TABLE todos ADD COLUMN screenshot_url TEXT;

-- Create storage bucket for task screenshots (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-screenshots', 'task-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload to task-screenshots bucket
CREATE POLICY "Authenticated users can upload task screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-screenshots');

-- Storage policy: Allow public read access to task screenshots
CREATE POLICY "Public can view task screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'task-screenshots');

-- Storage policy: Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete task screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-screenshots');

-- Comment on the new column
COMMENT ON COLUMN todos.screenshot_url IS 'Optional URL to a screenshot image stored in Supabase storage';
