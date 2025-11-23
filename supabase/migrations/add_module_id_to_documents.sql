-- Add module_id column to documents table
-- This allows linking documents to specific training modules

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_module_id ON documents(module_id);

-- Add comment to explain the column
COMMENT ON COLUMN documents.module_id IS 'Optional reference to a training module';
