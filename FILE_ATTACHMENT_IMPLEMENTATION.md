# Training Module File Attachments - Implementation Guide

## Overview
This implementation adds file attachment functionality to training modules, allowing you to upload and manage presentations, SCORM packages, PDFs, videos, and other training materials.

## Database Schema Changes

### SQL Migration Required
Run this SQL in your Supabase SQL Editor:

```sql
-- Add attachments column to modules table
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN modules.attachments IS 'Array of attached files (presentations, SCORM, documents) with metadata: [{name, url, size, type, uploaded_at}]';
```

**Verification Script**: Run `node scripts/add-attachments-column.js` to check if the column exists.

### Attachments Data Structure
```json
[
  {
    "name": "Training Presentation.pptx",
    "url": "https://supabase.storage/MODULES/training-modules/123456_presentation.pptx",
    "size": 1024000,
    "type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "uploaded_at": "2025-11-13T10:30:00Z"
  }
]
```

## Components Created

### 1. ModuleFileAttachments.tsx
**Location**: `src/components/modules/ModuleFileAttachments.tsx`

**Features**:
- Multiple file upload with progress tracking
- File type detection with icons (📊 presentations, 📦 zip/SCORM, 📄 PDFs, 🎥 videos, 🖼️ images)
- File download functionality
- File removal capability
- File size formatting
- Read-only mode support (for viewing)

**Supported File Types**:
- Presentations: `.ppt`, `.pptx`
- Documents: `.pdf`, `.doc`, `.docx`
- SCORM: `.zip`, `.scorm`
- Videos: `.mp4`, `.mov`, `.avi`
- Images: `.jpg`, `.jpeg`, `.png`

**Storage Location**: Files are uploaded to `MODULES` bucket under `training-modules/` folder

## Modified Components

### 1. AddModuleTab.tsx
- Added file attachment state management
- Integrated ModuleFileAttachments component
- Includes attachments in form submission
- Resets attachments on successful submission

### 2. EditModuleTab.tsx
- Added attachments to module interface
- Loads existing attachments from module data
- Saves attachments when updating module
- Syncs attachments state with module prop changes

### 3. ViewModuleTab.tsx
- Displays attachments in read-only mode
- Shows download functionality for viewers
- Conditionally renders attachments section

### 4. TrainingModuleManager.tsx
- Updated Module interface to include attachments field

### 5. Edit Module Page
- Updated to pass attachments through to edit form

## Usage Instructions

### Adding Files to a New Module

1. Navigate to **Training Module Management** → **Add Module** tab
2. Fill in module details (name, description, etc.)
3. Scroll to the **Attachments** section
4. Click **"Choose Files"** button
5. Select one or multiple files to upload
6. Files will upload immediately and appear in the list
7. Remove files by clicking the trash icon if needed
8. Submit the form to save the module with attachments

### Adding Files to an Existing Module

1. Navigate to **Training Module Management** → **View** tab
2. Click **Edit** on the module you want to update
3. Scroll to the **Attachments** section
4. Upload new files or remove existing ones
5. Click **Save** to update the module

### Viewing Attachments

1. In the **View** tab, attachments are displayed at the bottom
2. Click the download icon to download any file
3. File metadata (size, upload date) is shown for each attachment

## File Upload Process

1. **File Selection**: User selects files via file input
2. **Upload**: Files are uploaded to Supabase Storage (`MODULES` bucket)
3. **Naming**: Files are prefixed with timestamp: `training-modules/{timestamp}_{filename}`
4. **URL Generation**: Public URL is generated for each file
5. **Metadata Storage**: File info (name, URL, size, type, date) stored in `attachments` JSON array
6. **Database Save**: Attachments array saved to modules table

## Security Considerations

### Storage Bucket Permissions
The `MODULES` bucket should be configured as **public** with the following policies:

**Option 1: Run SQL** - Execute [add-modules-storage-policies.sql](scripts/add-modules-storage-policies.sql):
```sql
-- Allow public read access for downloads
CREATE POLICY "Public read access for modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'MODULES');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload modules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'MODULES'
  AND auth.role() = 'authenticated'
);
```

**Option 2: Dashboard** - In Supabase Dashboard:
1. Go to Storage > MODULES > Policies
2. Create policies for SELECT (public) and INSERT (authenticated)

### File Type Validation
The component accepts specific file types via the `accept` attribute:
```
.pdf,.ppt,.pptx,.doc,.docx,.zip,.mp4,.mov,.avi,.jpg,.jpeg,.png,.scorm
```

## File Download Implementation

Downloads work by:
1. Extracting file path from public URL
2. Using Supabase Storage download API
3. Creating a blob URL
4. Triggering browser download
5. Cleaning up blob URL

## Troubleshooting

### Files Not Uploading
- Check Supabase storage bucket exists: `MODULES` (case-sensitive!)
- Verify storage policies allow authenticated uploads (run [check-storage-policies.js](scripts/check-storage-policies.js))
- Check browser console for errors
- Ensure file size is within limits
- Make sure you're logged in as an authenticated user

### Files Not Downloading
- Verify public read access policy exists
- Check that file URLs are valid
- Test URL directly in browser

### Attachments Not Saving
- Run database migration SQL first
- Verify `attachments` column exists in modules table
- Check browser console for database errors

## Testing Checklist

- [ ] Run SQL migration to add attachments column
- [ ] Upload a file when creating a new module
- [ ] Upload multiple files at once
- [ ] View attachments on existing module
- [ ] Download an attachment
- [ ] Remove an attachment
- [ ] Edit a module and add more attachments
- [ ] Edit a module and remove attachments
- [ ] Verify file icons display correctly for different types
- [ ] Check file sizes display correctly
- [ ] Test with large files (>10MB)

## Future Enhancements

Potential improvements:
- File size limits and validation
- Virus scanning integration
- Thumbnail preview for images/videos
- SCORM package extraction and preview
- Bulk file operations
- File version history
- Progress bars for large uploads
- Drag-and-drop upload interface
- Search and filter attachments
- File type restrictions per module type

## Files Created/Modified

### New Files
- `src/components/modules/ModuleFileAttachments.tsx`
- `scripts/add-module-attachments.sql`
- `scripts/add-attachments-column.js`
- `scripts/check-modules-schema.js`
- `FILE_ATTACHMENT_IMPLEMENTATION.md` (this file)

### Modified Files
- `src/components/modules/AddModuleTab.tsx`
- `src/components/modules/EditModuleTab.tsx`
- `src/components/modules/ViewModuleTab.tsx`
- `src/components/modules/TrainingModuleManager.tsx`
- `src/app/admin/modules/edit/[id]/page.tsx`

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database migration was successful
3. Check Supabase storage bucket and policies
4. Review this documentation

---

**Implementation Date**: November 13, 2025
**Version**: 1.0
**Status**: Ready for Testing
