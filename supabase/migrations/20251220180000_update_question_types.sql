-- ============================================================================
-- UPDATE QUESTION TYPES AND ADD MISSING FIELDS
-- ============================================================================
-- This migration updates the questions table to support additional question types
-- and adds the correct_answer field for short answer questions
-- ============================================================================

-- Add the correct_answer field for short answer questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Update the question type constraint to include all supported types
ALTER TABLE questions 
DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE questions 
ADD CONSTRAINT questions_type_check 
CHECK (type IN ('mcq_single', 'mcq_multi', 'true_false', 'short_answer'));

-- Update the comment to reflect all supported types
COMMENT ON COLUMN questions.type IS 'Question type: mcq_single, mcq_multi, true_false, or short_answer';
COMMENT ON COLUMN questions.correct_answer IS 'Correct answer for short_answer questions (null for other types)';
