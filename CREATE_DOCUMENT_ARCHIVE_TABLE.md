# Fix: Create Missing document_archive Table

## Error
```
Failed to load resource: the server responded with a status of 404 () (document_archive, line 0)
```

## Solution
The `document_archive` table is missing from your Supabase database. Follow these steps to create it:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the following SQL:

```sql
-- Create document_archive table to store archived versions of documents
CREATE TABLE IF NOT EXISTS document_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  archived_version INTEGER NOT NULL,
  title TEXT NOT NULL,
  reference_code TEXT,
  file_url TEXT,
  document_type_id UUID,
  notes TEXT,
  section_id UUID,
  created_at TIMESTAMPTZ,
  change_summary TEXT,
  change_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by_auth_id UUID,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_archive_document_id
  ON document_archive(document_id);

CREATE INDEX IF NOT EXISTS idx_document_archive_archived_at
  ON document_archive(archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_archive_section_id
  ON document_archive(section_id);

-- Add Row Level Security (RLS)
ALTER TABLE document_archive ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read archives
CREATE POLICY "Allow authenticated users to read document archives"
  ON document_archive
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert archives
CREATE POLICY "Allow authenticated users to create document archives"
  ON document_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

6. Click **Run** or press `Ctrl/Cmd + Enter`

### Option 2: Using the SQL File

The SQL file has been created at: `scripts/create-document-archive-table.sql`

You can copy and paste this into the Supabase SQL Editor.

### What This Table Does

The `document_archive` table stores historical versions of documents when they are:
- Manually archived by users
- Automatically archived when a new version is uploaded
- Replaced by newer versions

### Fields Explanation

- `id`: Unique identifier for each archive entry
- `document_id`: References the original document
- `archived_version`: The version number of the archived document
- `title`: Document title at time of archiving
- `reference_code`: Document reference code
- `file_url`: URL to the archived file
- `document_type_id`: Type of document
- `notes`: Any notes about the document
- `section_id`: Related section
- `created_at`: Original creation date
- `change_summary`: Why this version was archived
- `change_date`: When the change occurred
- `archived_by_auth_id`: Who archived it
- `archived_at`: When it was archived

### After Creating the Table

Once the table is created, the 404 error should be resolved and you'll be able to:
- Archive documents
- View archived documents at `/admin/documents/archived`
- Track document version history
