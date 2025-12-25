-- Add location column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add a check constraint for valid locations
ALTER TABLE documents
ADD CONSTRAINT documents_location_check
CHECK (location IS NULL OR location IN ('England', 'Wales', 'Poland', 'Group'));

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_location ON documents(location);

-- Add comment explaining the column
COMMENT ON COLUMN documents.location IS 'Geographic location or scope of the document: England, Wales, Poland, or Group';
