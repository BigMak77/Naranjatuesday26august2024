-- Add ref_code to document_types (replace prefix)
ALTER TABLE document_types
DROP COLUMN IF EXISTS prefix;

ALTER TABLE document_types
ADD COLUMN IF NOT EXISTS ref_code TEXT;

COMMENT ON COLUMN document_types.ref_code IS 'Reference code for document type, up to 4 characters (e.g., PO for Policy, PR for Procedure, SSOW for Safe System of Work)';

-- Add ref_code to standard_sections table
ALTER TABLE standard_sections
ADD COLUMN IF NOT EXISTS ref_code TEXT;

COMMENT ON COLUMN standard_sections.ref_code IS 'Reference code for document section, up to 4 characters (e.g., 01, 02, etc.)';

-- Create location reference codes lookup
-- Since locations are stored as text in users table, we'll use a convention:
-- England = EN, Wales = WA, Poland = PL, Group = GR
-- This will be enforced in the application layer

COMMENT ON COLUMN users.location IS 'User location (England=EN, Wales=WA, Poland=PL, Group=GR) - ref codes used in document prefixes';
