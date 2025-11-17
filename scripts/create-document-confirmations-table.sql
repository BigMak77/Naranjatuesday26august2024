-- Create document_confirmations table to track user acknowledgment of documents
CREATE TABLE IF NOT EXISTS document_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  signature TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_document_confirmation_document
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE,

  -- Ensure a user can only confirm a document once (prevent duplicates)
  CONSTRAINT unique_user_document_confirmation
    UNIQUE(document_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_confirmations_document_id
  ON document_confirmations(document_id);

CREATE INDEX IF NOT EXISTS idx_document_confirmations_user_id
  ON document_confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_document_confirmations_confirmed_at
  ON document_confirmations(confirmed_at DESC);

-- Add comments to table and columns
COMMENT ON TABLE document_confirmations IS 'Tracks user confirmations and acknowledgments of documents';
COMMENT ON COLUMN document_confirmations.signature IS 'Electronic signature (user full name)';
COMMENT ON COLUMN document_confirmations.ip_address IS 'IP address at time of confirmation (optional)';
COMMENT ON COLUMN document_confirmations.user_agent IS 'Browser user agent at time of confirmation (optional)';

-- Enable Row Level Security
ALTER TABLE document_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own confirmations
CREATE POLICY "Users can view their own document confirmations"
  ON document_confirmations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own confirmations
CREATE POLICY "Users can create their own document confirmations"
  ON document_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy for admins/managers to view all confirmations
CREATE POLICY "Admins can view all document confirmations"
  ON document_confirmations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.auth_id = auth.uid()
      AND user_profiles.role IN ('Super Admin', 'Admin', 'HR Admin')
    )
  );

-- Create a view for confirmation reports
CREATE OR REPLACE VIEW document_confirmation_report AS
SELECT
  dc.id,
  dc.document_id,
  d.title as document_title,
  d.reference_code,
  dc.user_id,
  dc.user_email,
  dc.user_name,
  up.first_name || ' ' || up.last_name as profile_name,
  up.department,
  dc.signature,
  dc.confirmed_at,
  dc.ip_address
FROM document_confirmations dc
LEFT JOIN documents d ON dc.document_id = d.id
LEFT JOIN user_profiles up ON dc.user_id = up.auth_id
ORDER BY dc.confirmed_at DESC;

-- Grant access to the view
GRANT SELECT ON document_confirmation_report TO authenticated;
