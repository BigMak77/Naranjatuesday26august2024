# Storage Policy Setup - REQUIRED ACTION

## Issue
Files are not saving to Supabase storage because the `modules` bucket exists but has no storage policies configured. This causes a "row-level security policy" error.

## What Has Been Done
✅ Created the `modules` storage bucket
✅ Set it as a public bucket
✅ Created SQL file with correct policies

## What You Need To Do NOW

Storage policies **cannot** be applied programmatically via the API. You **must** apply them manually:

### Step 1: Open SQL Editor
Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new

### Step 2: Copy This SQL

```sql
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
```

### Step 3: Click "Run"
You should see: **"Success. No rows returned"**

### Step 4: Verify
Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/storage/buckets/modules

Click on the "Policies" tab and you should see 4 policies:
1. ✅ Public read access for modules
2. ✅ Authenticated users can upload modules
3. ✅ Authenticated users can update modules
4. ✅ Authenticated users can delete modules

### Step 5: Test
Try uploading a file through your Training Module Manager interface. It should work now!

## Technical Details

- **Bucket Name:** `modules` (lowercase)
- **Location:** Defined in `src/lib/storage-config.ts`
- **Upload Path:** `modules/training-modules/{timestamp}_{filename}`
- **Component:** `src/components/modules/ModuleFileAttachments.tsx`
- **File Size Limit:** 50 MB (default) - **⚠️ You may need to increase this for video files**
- **Allowed Types:** PDF, PowerPoint, Word, Videos, SCORM packages, Images

### Increasing File Size Limit (For Large Video Files)

If you get "The object exceeded the maximum allowed size" error when uploading videos:

1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/storage/buckets
2. Click the three dots (⋮) on the "modules" bucket → "Edit bucket"
3. Change "File size limit" to `524288000` (500 MB) or higher
4. Click "Save"

**Recommended limits:**
- Standard training videos: 500 MB (`524288000` bytes)
- Large videos: 1 GB (`1073741824` bytes)

See [INCREASE_FILE_SIZE_LIMIT.md](INCREASE_FILE_SIZE_LIMIT.md) for detailed instructions.

## Troubleshooting

If uploads still fail after applying policies:
1. **"row-level security policy" error** → Apply the SQL policies above (Step 1-3)
2. **"exceeded maximum allowed size" error** → Increase file size limit in bucket settings
3. Check browser console for specific error messages
4. Verify you're logged in (policies require authenticated users)
5. Run: `node scripts/check-storage-policies.js` to verify bucket exists
6. Check Supabase Dashboard > Storage > modules > Policies to confirm policies are active
