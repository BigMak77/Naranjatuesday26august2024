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
  archived_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_document_archive_document
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_document_archive_document_type
    FOREIGN KEY (document_type_id)
    REFERENCES document_type(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_document_archive_section
    FOREIGN KEY (section_id)
    REFERENCES standard_sections(id)
    ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_archive_document_id
  ON document_archive(document_id);

CREATE INDEX IF NOT EXISTS idx_document_archive_archived_at
  ON document_archive(archived_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_archive_section_id
  ON document_archive(section_id);

-- Add comment to table
COMMENT ON TABLE document_archive IS 'Stores archived versions of documents with change history';

-- Enable Row Level Security
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
