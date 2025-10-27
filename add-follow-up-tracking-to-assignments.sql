-- Add follow-up assessment tracking columns to user_assignments table
-- This allows tracking when follow-up assessments are due and completed

-- Add follow_up_due_date column (timestamp, nullable)
-- This will be calculated when a training is completed, based on the module's review_period
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_due_date TIMESTAMPTZ;

-- Add follow_up_completed_at column (timestamp, nullable)
-- This will be set when the user completes their follow-up assessment
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_completed_at TIMESTAMPTZ;

-- Add follow_up_required column (boolean, defaults to false)
-- This is copied from the module at assignment time
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT false NOT NULL;

-- Add comments to document these columns
COMMENT ON COLUMN user_assignments.follow_up_due_date IS 'The date when the follow-up assessment is due (calculated from completed_at + module review_period)';
COMMENT ON COLUMN user_assignments.follow_up_completed_at IS 'The date when the user completed their follow-up assessment';
COMMENT ON COLUMN user_assignments.follow_up_required IS 'Indicates if this assignment requires a follow-up assessment (copied from module at assignment time)';

-- Create index for querying overdue follow-ups
CREATE INDEX IF NOT EXISTS idx_user_assignments_follow_up_due
ON user_assignments(follow_up_due_date)
WHERE follow_up_due_date IS NOT NULL AND follow_up_completed_at IS NULL;

-- Create index for follow-up required assignments
CREATE INDEX IF NOT EXISTS idx_user_assignments_follow_up_required
ON user_assignments(follow_up_required)
WHERE follow_up_required = true;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_assignments'
AND column_name IN ('follow_up_due_date', 'follow_up_completed_at', 'follow_up_required')
ORDER BY ordinal_position;
