-- Add attachments column to modules table
-- This will store an array of file objects with metadata

ALTER TABLE modules
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN modules.attachments IS 'Array of attached files (presentations, SCORM, documents) with metadata: [{name, url, size, type, uploaded_at}]';

-- Example structure:
-- [
--   {
--     "name": "Training Presentation.pptx",
--     "url": "https://supabase.storage/documents/123456_presentation.pptx",
--     "size": 1024000,
--     "type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
--     "uploaded_at": "2025-11-13T10:30:00Z"
--   },
--   {
--     "name": "SCORM Package.zip",
--     "url": "https://supabase.storage/documents/123456_scorm.zip",
--     "size": 5120000,
--     "type": "application/zip",
--     "uploaded_at": "2025-11-13T10:31:00Z"
--   }
-- ]
