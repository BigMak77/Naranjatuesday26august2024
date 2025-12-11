-- ============================================
-- FOLLOW-UP SYSTEM REFACTOR
-- ============================================
-- This migration refactors the follow-up system to support three distinct scenarios:
-- 1. Review Period: Scheduled refresher training (module setting: refresh_period)
-- 2. Follow-Up Assessment: Post-training competency check (module setting: requires_follow_up + review_period)
-- 3. Unsatisfactory Training: Immediate re-training needed (trainer decision at training time)

-- ============================================
-- STEP 1: Add new fields to modules table
-- ============================================

-- Rename existing review_period to follow_up_period for clarity
-- This is for post-training competency assessments
ALTER TABLE modules
RENAME COLUMN review_period TO follow_up_period;

-- Add comment to clarify the purpose
COMMENT ON COLUMN modules.follow_up_period IS 'Period after training completion when a follow-up assessment is required (e.g., "1 week", "2 weeks", "1 month", "3 months"). Used when requires_follow_up is true.';

-- Add refresh_period for scheduled refresher training
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS refresh_period TEXT DEFAULT 'Never';

COMMENT ON COLUMN modules.refresh_period IS 'Period after training completion when refresher training is required (e.g., "6 months", "1 year", "2 years", "Never"). Creates a new training assignment.';

-- ============================================
-- STEP 2: Update user_assignments table
-- ============================================

-- Add new field to distinguish between assessment types
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS assignment_reason TEXT DEFAULT 'initial';

COMMENT ON COLUMN user_assignments.assignment_reason IS 'Reason for assignment: "initial", "refresh", "follow_up_assessment", "unsatisfactory_retrain"';

-- Rename follow_up fields for clarity
ALTER TABLE user_assignments
RENAME COLUMN follow_up_required TO follow_up_assessment_required;

ALTER TABLE user_assignments
RENAME COLUMN follow_up_due_date TO follow_up_assessment_due_date;

ALTER TABLE user_assignments
RENAME COLUMN follow_up_completed_at TO follow_up_assessment_completed_at;

-- Add fields for tracking training outcome
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS training_outcome TEXT;

COMMENT ON COLUMN user_assignments.training_outcome IS 'Outcome of training session: "completed", "needs_improvement", "failed". Set by trainer during training log.';

-- Add field for refresh due date (separate from follow-up assessment)
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS refresh_due_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN user_assignments.refresh_due_date IS 'Date when refresher training is due based on module refresh_period. Triggers new assignment creation.';

-- Add field for follow-up assessment outcome
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_assessment_outcome TEXT;

COMMENT ON COLUMN user_assignments.follow_up_assessment_outcome IS 'Outcome of follow-up assessment: "satisfactory", "needs_improvement". Set by trainer during sign-off.';

-- Add field for follow-up assessment notes
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_assessment_notes TEXT;

-- Add field for trainer signature on follow-up assessment
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS follow_up_assessment_signature TEXT;

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_assignments_follow_up_assessment_due
ON user_assignments(follow_up_assessment_due_date)
WHERE follow_up_assessment_required = true AND follow_up_assessment_completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_assignments_refresh_due
ON user_assignments(refresh_due_date)
WHERE completed_at IS NOT NULL AND refresh_due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_assignments_training_outcome
ON user_assignments(training_outcome)
WHERE training_outcome IS NOT NULL;

-- ============================================
-- STEP 4: Update existing data
-- ============================================

-- Update assignment_reason for existing records
UPDATE user_assignments
SET assignment_reason = 'initial'
WHERE assignment_reason IS NULL;

-- ============================================
-- STEP 5: Add check constraints
-- ============================================

ALTER TABLE user_assignments
ADD CONSTRAINT chk_assignment_reason
CHECK (assignment_reason IN ('initial', 'refresh', 'follow_up_assessment', 'unsatisfactory_retrain'));

ALTER TABLE user_assignments
ADD CONSTRAINT chk_training_outcome
CHECK (training_outcome IN ('completed', 'needs_improvement', 'failed') OR training_outcome IS NULL);

ALTER TABLE user_assignments
ADD CONSTRAINT chk_follow_up_assessment_outcome
CHECK (follow_up_assessment_outcome IN ('satisfactory', 'needs_improvement') OR follow_up_assessment_outcome IS NULL);

-- ============================================
-- STEP 6: Function to calculate next refresh date
-- ============================================

CREATE OR REPLACE FUNCTION calculate_refresh_date(
  completion_date TIMESTAMP WITH TIME ZONE,
  refresh_period TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF refresh_period = 'Never' OR refresh_period = '0' OR refresh_period IS NULL THEN
    RETURN NULL;
  END IF;

  CASE refresh_period
    WHEN '6 months' THEN
      RETURN completion_date + INTERVAL '6 months';
    WHEN '1 year' THEN
      RETURN completion_date + INTERVAL '1 year';
    WHEN '2 years' THEN
      RETURN completion_date + INTERVAL '2 years';
    WHEN '3 years' THEN
      RETURN completion_date + INTERVAL '3 years';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_refresh_date IS 'Calculates the next refresh training due date based on completion date and refresh period';

-- ============================================
-- STEP 7: Function to calculate follow-up assessment date
-- ============================================

CREATE OR REPLACE FUNCTION calculate_follow_up_assessment_date(
  completion_date TIMESTAMP WITH TIME ZONE,
  follow_up_period TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF follow_up_period = '0' OR follow_up_period IS NULL THEN
    RETURN NULL;
  END IF;

  CASE follow_up_period
    WHEN '1 week' THEN
      RETURN completion_date + INTERVAL '1 week';
    WHEN '2 weeks' THEN
      RETURN completion_date + INTERVAL '2 weeks';
    WHEN '1 month' THEN
      RETURN completion_date + INTERVAL '1 month';
    WHEN '3 months' THEN
      RETURN completion_date + INTERVAL '3 months';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_follow_up_assessment_date IS 'Calculates the follow-up assessment due date based on completion date and follow-up period';

-- ============================================
-- STEP 8: Create view for dashboard queries
-- ============================================

CREATE OR REPLACE VIEW training_follow_ups AS
SELECT
  ua.id,
  ua.auth_id,
  ua.item_id as module_id,
  m.name as module_name,
  ua.follow_up_assessment_due_date as due_date,
  ua.follow_up_assessment_completed_at as completed_at,
  ua.follow_up_assessment_outcome as outcome,
  ua.follow_up_assessment_notes as notes,
  ua.completed_at as training_completed_at,
  CASE
    WHEN ua.follow_up_assessment_completed_at IS NOT NULL THEN 'completed'
    WHEN ua.follow_up_assessment_due_date < NOW() THEN 'overdue'
    WHEN ua.follow_up_assessment_due_date >= NOW() THEN 'upcoming'
    ELSE 'unknown'
  END as status,
  EXTRACT(DAY FROM NOW() - ua.follow_up_assessment_due_date)::INTEGER as days_overdue
FROM user_assignments ua
JOIN modules m ON ua.item_id = m.id
WHERE ua.item_type = 'module'
  AND ua.follow_up_assessment_required = true
  AND ua.follow_up_assessment_due_date IS NOT NULL
ORDER BY ua.follow_up_assessment_due_date ASC;

COMMENT ON VIEW training_follow_ups IS 'View for querying follow-up assessments with status calculation';

-- ============================================
-- STEP 9: Create view for refresh training
-- ============================================

CREATE OR REPLACE VIEW training_refresh_due AS
SELECT
  ua.id,
  ua.auth_id,
  ua.item_id as module_id,
  m.name as module_name,
  ua.refresh_due_date as due_date,
  ua.completed_at as last_completed_at,
  m.refresh_period,
  CASE
    WHEN ua.refresh_due_date < NOW() THEN 'overdue'
    WHEN ua.refresh_due_date >= NOW() THEN 'upcoming'
    ELSE 'unknown'
  END as status,
  EXTRACT(DAY FROM NOW() - ua.refresh_due_date)::INTEGER as days_overdue
FROM user_assignments ua
JOIN modules m ON ua.item_id = m.id
WHERE ua.item_type = 'module'
  AND ua.completed_at IS NOT NULL
  AND ua.refresh_due_date IS NOT NULL
  AND ua.refresh_due_date IS NOT NULL
ORDER BY ua.refresh_due_date ASC;

COMMENT ON VIEW training_refresh_due IS 'View for querying refresh training due dates';
