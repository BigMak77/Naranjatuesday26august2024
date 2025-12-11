-- ============================================
-- Direct SQL fix: Rename review_period to follow_up_period
-- ============================================
-- Run this directly in your Supabase SQL editor or via psql

-- Check current column name
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'modules'
AND column_name IN ('review_period', 'follow_up_period');

-- Rename the column if it exists
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
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'modules'
      AND column_name = 'follow_up_period'
    ) THEN
      RAISE NOTICE 'Column follow_up_period already exists, no action needed';
    ELSE
      RAISE EXCEPTION 'Neither review_period nor follow_up_period column exists in modules table';
    END IF;
  END IF;
END $$;

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'modules'
AND column_name IN ('review_period', 'follow_up_period');
