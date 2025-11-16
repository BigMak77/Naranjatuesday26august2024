-- Storage policies for modules bucket (lowercase)
-- This fixes the bucket name mismatch from MODULES to modules

-- Drop existing policies if they exist (with old uppercase name)
DROP POLICY IF EXISTS "Public read access for modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update modules" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete modules" ON storage.objects;

-- Allow public read access for downloads
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
