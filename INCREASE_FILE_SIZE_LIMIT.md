# Increase File Size Limit for Modules Bucket

## Current Issue
The video file "MH HRA.mp4" exceeds the current 50 MB file size limit for the `modules` storage bucket.

**Error:** `The object exceeded the maximum allowed size`

## Solution: Increase File Size Limit

The file size limit **cannot** be updated via API. You must update it manually in Supabase Dashboard.

### Step-by-Step Instructions

1. **Open Supabase Storage Dashboard**
   - Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/storage/buckets

2. **Edit the modules bucket**
   - Find the "modules" bucket in the list
   - Click the three dots menu (⋮) on the right side
   - Select "Edit bucket"

3. **Update File Size Limit**
   - Change "File size limit" from `52428800` (50 MB) to a larger value
   - **Recommended values:**
     - For training videos (typical): `524288000` (500 MB)
     - For larger videos: `1073741824` (1 GB)
     - Maximum (Supabase free tier): `5368709120` (5 GB)

4. **Update Allowed MIME Types (Optional)**
   - Add additional video formats if needed:
     - `video/mp4`
     - `video/quicktime`
     - `video/x-msvideo`
     - `video/webm`
     - `video/x-ms-wmv`

5. **Save Changes**
   - Click "Save" or "Update bucket"

### Recommended Setting

For training module videos, I recommend setting the limit to **500 MB** which should cover most training videos:

```
File size limit: 524288000 bytes (500 MB)
```

### Alternative: Check Video File Size

Before increasing the limit, you can check the actual size of your video file:

**On Mac:**
```bash
ls -lh "MH HRA.mp4"
```

**On Windows:**
```cmd
dir "MH HRA.mp4"
```

This will help you determine the appropriate file size limit.

### Supabase Storage Limits by Plan

- **Free Plan:** Up to 1 GB total storage, 50 MB per file (default)
- **Pro Plan:** Up to 100 GB total storage, larger file limits available
- **Custom:** Contact Supabase for enterprise limits

### After Updating

Once you've updated the file size limit in the Supabase Dashboard:
1. Refresh your application
2. Try uploading the video file again
3. It should now upload successfully

### Troubleshooting

If you still get errors after updating:
1. Verify the limit was saved (check bucket settings)
2. Clear browser cache and reload
3. Check the actual file size of your video
4. Ensure you have enough storage quota remaining in your Supabase project
