-- Add SELECT policy for NARANJA DOCS bucket to allow public listing and reading

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public can list and read NARANJA DOCS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to NARANJA DOCS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update NARANJA DOCS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from NARANJA DOCS" ON storage.objects;

-- Create policy to allow public SELECT (list and read) on NARANJA DOCS bucket
CREATE POLICY "Public can list and read NARANJA DOCS"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'NARANJA DOCS');

-- If you also want to allow authenticated users to upload, update, and delete:
CREATE POLICY "Authenticated users can upload to NARANJA DOCS"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'NARANJA DOCS');

CREATE POLICY "Authenticated users can update NARANJA DOCS"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'NARANJA DOCS')
WITH CHECK (bucket_id = 'NARANJA DOCS');

CREATE POLICY "Authenticated users can delete from NARANJA DOCS"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'NARANJA DOCS');
