-- Create permanent training completion tracking table (Safe Version)
-- This table preserves training completion history across role changes

-- First, let's check if we need to handle any existing table
DROP TABLE IF EXISTS user_training_completions CASCADE;

CREATE TABLE user_training_completions (
  id BIGSERIAL PRIMARY KEY,
  auth_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('module', 'document')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_by_role_id TEXT, -- Track which role they had when they completed it
  
  -- Ensure one completion record per user per item
  UNIQUE(auth_id, item_id, item_type)
);

-- Add foreign key constraints after table creation (safer approach)
-- Check if users table exists and has auth_id column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'auth_id') THEN
    ALTER TABLE user_training_completions 
    ADD CONSTRAINT fk_user_training_completions_user 
    FOREIGN KEY (auth_id) REFERENCES users(auth_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Check if roles table exists and add constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
    ALTER TABLE user_training_completions 
    ADD CONSTRAINT fk_user_training_completions_role 
    FOREIGN KEY (completed_by_role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX idx_user_training_completions_auth_id 
  ON user_training_completions(auth_id);
CREATE INDEX idx_user_training_completions_item 
  ON user_training_completions(item_id, item_type);
CREATE INDEX idx_user_training_completions_completed_at 
  ON user_training_completions(completed_at);

-- Enable RLS
ALTER TABLE user_training_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (handle UUID to TEXT conversion)
CREATE POLICY "Users can view their own completions" ON user_training_completions
  FOR SELECT USING (auth_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own completions" ON user_training_completions
  FOR INSERT WITH CHECK (auth_id = auth.uid()::TEXT);

-- Admin policy - handle case where users table might not exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AND
     EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
    
    EXECUTE 'CREATE POLICY "Admins can view all completions" ON user_training_completions
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE users.auth_id = auth.uid()::TEXT 
          AND users.role_id IN (
            SELECT id FROM roles WHERE title ILIKE ''%admin%'' OR title ILIKE ''%manager%''
          )
        )
      )';
  END IF;
END $$;

-- Grant permissions for service role
GRANT ALL ON user_training_completions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE user_training_completions_id_seq TO service_role;

-- Comments for documentation
COMMENT ON TABLE user_training_completions IS 'Permanent record of training completions that persists across role changes';
COMMENT ON COLUMN user_training_completions.auth_id IS 'User who completed the training (references users.auth_id as TEXT)';
COMMENT ON COLUMN user_training_completions.item_id IS 'Module or document ID that was completed';
COMMENT ON COLUMN user_training_completions.item_type IS 'Type of training item (module or document)';
COMMENT ON COLUMN user_training_completions.completed_at IS 'When the training was completed';
COMMENT ON COLUMN user_training_completions.completed_by_role_id IS 'Role the user had when they completed this training';

-- Success message
SELECT 'user_training_completions table created successfully!' as status;
