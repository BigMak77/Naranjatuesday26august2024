-- Add prefix column to document_types table
ALTER TABLE document_types
ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Add a comment to explain the prefix column
COMMENT ON COLUMN document_types.prefix IS 'Optional prefix for document reference codes in this type (e.g., POL for Policy, PRO for Procedure, SOP for Standard Operating Procedure)';
