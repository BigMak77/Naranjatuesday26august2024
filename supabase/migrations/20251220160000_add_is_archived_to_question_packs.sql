-- ============================================================================
-- ADD IS_ARCHIVED COLUMN TO QUESTION_PACKS
-- ============================================================================
-- This migration adds an is_archived column to question_packs table
-- to allow archiving tests without deleting them
-- ============================================================================

-- Add is_archived column to question_packs
ALTER TABLE question_packs
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN question_packs.is_archived IS 'Whether this question pack is archived';

-- Create index for archived status
CREATE INDEX IF NOT EXISTS idx_question_packs_archived ON question_packs(is_archived);

-- Update RLS policy to exclude archived packs from normal user view
DROP POLICY IF EXISTS "Users can view active question packs" ON question_packs;

CREATE POLICY "Users can view active question packs"
  ON question_packs FOR SELECT
  TO authenticated
  USING (is_active = true AND is_archived = false);

-- Update questions policy to exclude archived packs
DROP POLICY IF EXISTS "Users can view questions in active packs" ON questions;

CREATE POLICY "Users can view questions in active packs"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_packs
      WHERE id = questions.pack_id
        AND is_active = true
        AND is_archived = false
    )
  );

-- Update question options policy to exclude archived packs
DROP POLICY IF EXISTS "Users can view question options" ON question_options;

CREATE POLICY "Users can view question options"
  ON question_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN question_packs qp ON q.pack_id = qp.id
      WHERE q.id = question_options.question_id
        AND qp.is_active = true
        AND qp.is_archived = false
    )
  );
