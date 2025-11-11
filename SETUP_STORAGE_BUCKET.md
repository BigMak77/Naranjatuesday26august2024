# Fix 409 Error: Setup Supabase Storage Bucket

## The Problem
You're getting a 409 error when trying to upload files to documents because the storage bucket doesn't exist or isn't configured properly.

## Solution: Create the Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the left sidebar

### Step 2: Create the "documents" Bucket
1. Click **New bucket**
2. Name: `documents`
3. **Public bucket**: ✅ Check this box (or files won't be accessible)
4. Click **Create bucket**

### Step 3: Set up Bucket Policies (Optional but Recommended)

If you want to restrict who can upload:

1. Click on the `documents` bucket
2. Go to **Policies** tab
3. Click **New policy**

#### Policy for Upload (INSERT):
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

#### Policy for Read (SELECT):
```sql
-- Allow public read access
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

#### Policy for Update:
```sql
-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated users to update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');
```

#### Policy for Delete:
```sql
-- Allow authenticated users to delete documents
CREATE POLICY "Allow authenticated users to delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

### Step 4: Test the Upload
1. Refresh your application
2. Go to `/admin/documents/add`
3. Try uploading a PDF file
4. It should now work without the 409 error!

## Code Changes Made
I've updated both upload pages to:
- Add `upsert: true` option (allows overwriting files)
- Show better error messages in the console
- Display the actual error message in alerts

## If You Still Get Errors
Check the browser console for the specific error message. It will now show:
- `File upload failed: [specific error message]`

Common issues:
- **Bucket not public**: Make sure "Public bucket" is checked
- **No policies**: If RLS is enabled, you need the policies above
- **Wrong bucket name**: Must be exactly `documents` (lowercase)
