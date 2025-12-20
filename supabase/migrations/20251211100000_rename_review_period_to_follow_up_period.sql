-- ============================================
-- Rename review_period to follow_up_period
-- ============================================
-- This migration renames the review_period column to follow_up_period
-- to match the code expectations and improve clarity

-- Check if the column exists before renaming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'review_period'
  ) THEN
    -- Rename the column
    ALTER TABLE modules
    RENAME COLUMN review_period TO follow_up_period;

    -- Add comment to clarify the purpose
    COMMENT ON COLUMN modules.follow_up_period IS 'Period after training completion when a follow-up assessment is required (e.g., "1 week", "2 weeks", "1 month", "3 months"). Used when requires_follow_up is true.';

    RAISE NOTICE 'Column review_period successfully renamed to follow_up_period';
  ELSE
    RAISE NOTICE 'Column review_period does not exist, skipping rename';
  END IF;
END $$;
