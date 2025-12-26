-- ============================================================================
-- REMOVE DUPLICATE TRAINING LOGS
-- ============================================================================
-- This migration removes duplicate entries from training_logs table.
-- Keeps only the first entry for each unique combination of (auth_id, topic, date)
-- ============================================================================

-- Delete duplicate training log entries, keeping only the one with the earliest created_at
DO $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Use a CTE to identify duplicates and delete all but the first one
  WITH duplicates AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY auth_id, topic, date
        ORDER BY created_at ASC, id ASC
      ) as row_num
    FROM training_logs
  )
  DELETE FROM training_logs
  WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE 'Removed % duplicate training log entries', v_deleted_count;
END $$;

-- Add a unique constraint to prevent future duplicates
-- Note: This allows multiple entries on different dates, but only one per user/topic/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_training_logs_unique_user_topic_date
ON training_logs(auth_id, topic, date);

COMMENT ON INDEX idx_training_logs_unique_user_topic_date IS
'Ensures only one training log entry per user per topic per date';
