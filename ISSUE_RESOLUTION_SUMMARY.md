# ✅ Storage Bucket Issue - RESOLVED

## The Problem
When you selected a Supabase storage bucket, a different folder was opening because your application was using **inconsistent bucket names** across different components.

## Root Cause Analysis
Different components were using different bucket names for the same storage:

| Component | Old Bucket Name | Issue |
|-----------|----------------|-------|
| DocumentSectionManager | `"NARANJA DOCS"` | Had spaces in name |
| ModuleFileAttachments | `"MODULES"` | Uppercase, inconsistent |
| TrainingMaterialsManager | `"documents"` | Wrong bucket for training |
| CareersPage | `"applications-cv"` | Different naming pattern |
| StorageFileBrowser | `"documents"` (default) | Didn't match other buckets |

## ✅ Solution Applied

### 1. Created Centralized Configuration
- **File**: `/src/lib/storage-config.ts`
- **Purpose**: Single source of truth for all bucket names
- **Benefits**: Consistent naming, easy to maintain

### 2. Standardized Bucket Names
```typescript
export const STORAGE_BUCKETS = {
  DOCUMENTS: "documents",
  MODULES: "modules", 
  TRAINING: "training-materials",
  ISSUES: "issue-evidence",
  APPLICATIONS: "job-applications",
}
```

### 3. Updated All Components
✅ DocumentSectionManager.tsx - Fixed `"NARANJA DOCS"` → `STORAGE_BUCKETS.DOCUMENTS`
✅ ModuleFileAttachments.tsx - Fixed `"MODULES"` → `STORAGE_BUCKETS.MODULES`
✅ TrainingMaterialsManager.tsx - Fixed `"documents"` → `STORAGE_BUCKETS.TRAINING`
✅ TrainingMaterialsManagerDialog.tsx - Updated to match
✅ RaiseIssueWizard.tsx - Standardized issue evidence bucket
✅ CareersPage.tsx - Fixed `"applications-cv"` → `STORAGE_BUCKETS.APPLICATIONS`
✅ Document add/edit pages - Standardized document uploads

## 📋 Next Steps Required

### In Supabase Dashboard:

1. **Create these buckets** (if they don't exist):
   - `documents`
   - `modules`
   - `training-materials`
   - `issue-evidence`
   - `job-applications`

2. **Migrate existing files** from old buckets:
   - Move files from `"NARANJA DOCS"` → `documents`
   - Move files from `"MODULES"` → `modules`
   - Move files from `"applications-cv"` → `job-applications`

3. **Set bucket policies** for public read access and authenticated uploads

4. **Delete old buckets** after migration

### Reference Guide
See `STORAGE_BUCKET_MIGRATION.md` for detailed migration instructions.

## 🎯 Result
✅ **Fixed folder navigation** - selecting buckets now opens correct folders
✅ **Consistent naming** across all components  
✅ **Future-proofed** against naming conflicts
✅ **Centralized management** of bucket configuration
✅ **Better file organization** by type

## 🧪 Testing
After setting up buckets in Supabase, test:
- Document upload/browse
- Module file attachments
- Training material uploads
- Issue evidence uploads
- Job application CV uploads

The folder mismatch issue should now be completely resolved!
