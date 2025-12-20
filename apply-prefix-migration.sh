#!/bin/bash

# Apply the document_types prefix migration directly
psql "$SUPABASE_DB_URL" << 'EOF'
-- Add prefix column to document_types table
ALTER TABLE document_types
ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Add a comment to explain the prefix column
COMMENT ON COLUMN document_types.prefix IS 'Optional prefix for document reference codes in this type (e.g., POL for Policy, PRO for Procedure, SOP for Standard Operating Procedure)';

-- Insert migration record
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
VALUES('20251217', 'add_prefix_to_document_types', ARRAY[
  'ALTER TABLE document_types ADD COLUMN IF NOT EXISTS prefix TEXT',
  'COMMENT ON COLUMN document_types.prefix IS ''Optional prefix for document reference codes in this type'''
])
ON CONFLICT (version) DO NOTHING;

SELECT 'Migration applied successfully!' AS result;
EOF
