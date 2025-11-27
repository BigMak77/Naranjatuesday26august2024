-- Add trainer_signature column to training_logs table
-- This allows recording both the learner's and trainer's signatures for training confirmation

ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS trainer_signature TEXT;

-- Add comment to document the column
COMMENT ON COLUMN training_logs.trainer_signature IS 'Base64 encoded image data URL of the trainer''s signature confirming the training session';
