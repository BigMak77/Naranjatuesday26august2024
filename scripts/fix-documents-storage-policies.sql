-- Fix storage policies for documents bucket
-- This allows users to list and read files from the documents bucket

-- Make sure documents bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Create policy to allow anyone to read/list files in documents bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
