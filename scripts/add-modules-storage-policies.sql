-- Storage policies for modules bucket (lowercase - matches storage-config.ts)
-- Run this in Supabase SQL Editor to enable file uploads and downloads
-- NOTE: The bucket name is 'modules' (lowercase) NOT 'MODULES' (uppercase)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete modules" ON storage.objects;

-- Allow public read access for downloads (anyone can download module files)
CREATE POLICY "Public read access for modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload modules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update modules"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete modules"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);
