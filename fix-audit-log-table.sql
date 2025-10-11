-- Create the missing user_role_change_log table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_role_change_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_role_id UUID,
  new_role_id UUID,
  assignments_removed INTEGER DEFAULT 0,
  assignments_added INTEGER DEFAULT 0,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID DEFAULT auth.uid()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_role_change_log_user_id ON user_role_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_change_log_changed_at ON user_role_change_log(changed_at DESC);

-- Check if the table was created successfully
SELECT 'user_role_change_log table created successfully' as result;
