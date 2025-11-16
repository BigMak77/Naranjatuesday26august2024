# Supabase Storage Policies for Documents Bucket

## Required Policies

### 1. Public Read Policy (SELECT)
**Policy Name:** Public read for documents
**Operation:** SELECT
**Target roles:** public (anon)
**USING expression:**
```sql
(bucket_id = 'documents'::text)
```

This allows anyone to read/download files from the documents bucket.

### 2. Authenticated Upload Policy (INSERT)
**Policy Name:** Authenticated users can upload documents
**Operation:** INSERT
**Target roles:** authenticated
**WITH CHECK expression:**
```sql
(bucket_id = 'documents'::text)
```

This allows authenticated users to upload files to the documents bucket.

### 3. Authenticated Update Policy (UPDATE) - Optional
**Policy Name:** Authenticated users can update documents
**Operation:** UPDATE
**Target roles:** authenticated
**USING expression:**
```sql
(bucket_id = 'documents'::text)
```
**WITH CHECK expression:**
```sql
(bucket_id = 'documents'::text)
```

### 4. Authenticated Delete Policy (DELETE) - Optional
**Policy Name:** Authenticated users can delete documents
**Operation:** DELETE
**Target roles:** authenticated
**USING expression:**
```sql
(bucket_id = 'documents'::text)
```

## Current Issue

The policy shown in the screenshot appears to be combining operations. You may need to:

1. Create **separate policies** for each operation (SELECT, INSERT, UPDATE, DELETE)
2. Ensure the SELECT policy targets **public/anon** role for public read access
3. Ensure INSERT/UPDATE/DELETE policies target **authenticated** role

## How to Fix

1. Go to Storage > Policies in Supabase Dashboard
2. Delete the combined policy if needed
3. Create individual policies for each operation as shown above
4. Make sure to enable RLS on the storage.objects table
