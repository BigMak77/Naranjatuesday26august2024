-- Add translation-related columns and time tracking to training_logs table

-- Add translator signature column
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translator_signature TEXT;

-- Add translation required flag
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translation_required BOOLEAN DEFAULT FALSE;

-- Add translation language
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translation_language TEXT;

-- Add translator name
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translator_name TEXT;

-- Add time column for recording the time of training
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS time TIME;

-- Add comments to document the columns
COMMENT ON COLUMN training_logs.translator_signature IS 'Base64 encoded image data URL of the translator''s signature (when translation was required)';
COMMENT ON COLUMN training_logs.translation_required IS 'Flag indicating whether translation was required for this training session';
COMMENT ON COLUMN training_logs.translation_language IS 'The language used for translation during training';
COMMENT ON COLUMN training_logs.translator_name IS 'Name of the translator who assisted during training';
COMMENT ON COLUMN training_logs.time IS 'Time when the training session was conducted';
