-- Add module_id and document_id columns to question_packs table
-- This allows attaching tests to specific training modules or documents

ALTER TABLE question_packs
ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_packs_module_id ON question_packs(module_id);
CREATE INDEX IF NOT EXISTS idx_question_packs_document_id ON question_packs(document_id);

-- Add comment to explain the columns
COMMENT ON COLUMN question_packs.module_id IS 'Optional reference to a training module';
COMMENT ON COLUMN question_packs.document_id IS 'Optional reference to a document';
