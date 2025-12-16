-- Create junction table for many-to-many relationship between documents and modules
CREATE TABLE IF NOT EXISTS document_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  -- Ensure each document-module pair is unique
  UNIQUE(document_id, module_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_modules_document_id ON document_modules(document_id);
CREATE INDEX IF NOT EXISTS idx_document_modules_module_id ON document_modules(module_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE document_modules ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read document-module links
CREATE POLICY "Allow authenticated users to read document_modules"
  ON document_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert document-module links
CREATE POLICY "Allow authenticated users to insert document_modules"
  ON document_modules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to delete document-module links
CREATE POLICY "Allow authenticated users to delete document_modules"
  ON document_modules
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE document_modules IS 'Junction table linking documents to training modules. A document can require multiple training modules, and a module can support multiple documents.';
