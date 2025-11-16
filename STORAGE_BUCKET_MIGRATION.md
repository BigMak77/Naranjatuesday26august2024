# Storage Bucket Migration Guide

## Problem Fixed
Your application was experiencing folder navigation issues because different components were using inconsistent bucket names:

- Documents: `"NARANJA DOCS"` vs `"documents"`  
- Modules: `"MODULES"` vs `"modules"`
- Training: `"documents"` vs `"training-materials"`
- Issues: `"issue-evidence"` (correct)
- Applications: `"applications-cv"` vs `"job-applications"`

This caused selecting a storage bucket to open different folders because the bucket names didn't match.

## Solution Applied
✅ **Centralized bucket configuration** in `/src/lib/storage-config.ts`
✅ **Updated all components** to use standardized names
✅ **Added legacy name comments** for reference

## Required Supabase Setup

You need to create/rename these buckets in your Supabase dashboard:

### 1. Create Missing Buckets

Go to **Supabase Dashboard > Storage** and create these buckets:

| Bucket Name | Purpose | Public Access |
|-------------|---------|---------------|
| `documents` | Document files | ✅ Yes |
| `modules` | Training module attachments | ✅ Yes |
| `training-materials` | Training content files | ✅ Yes |
| `issue-evidence` | Issue evidence files | ✅ Yes |
| `job-applications` | CV/resume uploads | ✅ Yes |

### 2. Migrate Existing Data

If you have existing files in the old buckets, you need to move them:

#### From "NARANJA DOCS" to "documents"
```sql
-- This needs to be done manually in Supabase dashboard
-- 1. Download all files from "NARANJA DOCS" bucket
-- 2. Upload them to "documents" bucket  
-- 3. Update any database references to the new URLs
```

#### From "MODULES" to "modules"
```sql
-- Same process as above
-- 1. Download from "MODULES" 
-- 2. Upload to "modules"
-- 3. Update attachment URLs in modules table
```

#### From "applications-cv" to "job-applications"
```sql
-- Update application records if any exist
UPDATE applications 
SET cv_url = REPLACE(cv_url, 'applications-cv', 'job-applications')
WHERE cv_url LIKE '%applications-cv%';
```

### 3. Set Storage Policies

For each bucket, add these RLS policies:

```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'BUCKET_NAME');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload" ON storage.objects  
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'BUCKET_NAME');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'BUCKET_NAME');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE TO authenticated  
USING (bucket_id = 'BUCKET_NAME');
```

Replace `BUCKET_NAME` with each bucket name.

### 4. Delete Old Buckets (After Migration)

Once you've migrated all data and updated URLs:

1. **Delete "NARANJA DOCS" bucket**
2. **Delete "MODULES" bucket**  
3. **Delete "applications-cv" bucket**

## Testing

After setup, test each component:

1. **Documents**: Upload/browse files in document manager
2. **Modules**: Add file attachments to training modules
3. **Training**: Upload training materials
4. **Issues**: Attach evidence to issues
5. **Careers**: Upload CV files

## Files Changed

The following files were updated to use the centralized configuration:

- `/src/lib/storage-config.ts` (new)
- `/src/components/documents/DocumentSectionManager.tsx`
- `/src/components/modules/ModuleFileAttachments.tsx`
- `/src/components/training/TrainingMaterialsManager.tsx`
- `/src/components/training/TrainingMaterialsManagerDialog.tsx`
- `/src/components/issues/RaiseIssueWizard.tsx`
- `/src/components/homepage/CareersPage.tsx`
- `/src/app/admin/documents/add/page.tsx`
- `/src/app/admin/documents/edit/[id]/page.tsx`

## Benefits

✅ **Consistent naming** across all components
✅ **Centralized configuration** - easy to change bucket names
✅ **Fixed folder navigation** issues
✅ **Better organization** of files by type
✅ **Future-proofed** against naming conflicts
