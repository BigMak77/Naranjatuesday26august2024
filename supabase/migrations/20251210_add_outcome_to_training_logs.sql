-- Add outcome column to training_logs table
-- This column tracks the training outcome: completed, needs_improvement, or failed

-- First, add the column without constraint if it doesn't exist
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS outcome TEXT;

-- Update any existing NULL or invalid values to 'completed'
UPDATE training_logs
SET outcome = 'completed'
WHERE outcome IS NULL
   OR outcome NOT IN ('completed', 'needs_improvement', 'failed');

-- Set default for future inserts
ALTER TABLE training_logs
ALTER COLUMN outcome SET DEFAULT 'completed';

-- Now add the check constraint (drop first if it exists)
ALTER TABLE training_logs
DROP CONSTRAINT IF EXISTS chk_training_logs_outcome;

ALTER TABLE training_logs
ADD CONSTRAINT chk_training_logs_outcome
CHECK (outcome IN ('completed', 'needs_improvement', 'failed'));

-- Add comment to document the column
COMMENT ON COLUMN training_logs.outcome IS 'Training outcome: completed (satisfactory), needs_improvement (requires re-training), or failed (immediate re-training needed)';
