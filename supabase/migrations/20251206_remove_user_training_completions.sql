-- Migration to remove redundant user_training_completions table
-- We're consolidating to a two-table system:
-- 1. user_assignments: Active training queue and current status
-- 2. training_logs: Detailed session records with signatures and full audit trail

-- The user_training_completions table was redundant as:
-- - user_assignments already tracks completion dates
-- - training_logs provides detailed completion records
-- - Historical data is preserved in both tables

-- Drop the table
DROP TABLE IF EXISTS user_training_completions CASCADE;

-- Add comment
COMMENT ON DATABASE postgres IS 'Removed user_training_completions table - using user_assignments and training_logs for all completion tracking';
