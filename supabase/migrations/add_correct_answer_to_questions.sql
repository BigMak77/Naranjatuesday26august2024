-- Add correct_answer column to questions table for short answer questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS correct_answer TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN questions.correct_answer IS 'Correct answer for short answer type questions';
