-- ============================================================================
-- COMPLETE FIX FOR TRAINING DASHBOARD NOT UPDATING
-- ============================================================================
-- This SQL script fixes the issue where the training dashboard doesn't update
-- when users complete tests.
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql
-- 3. Paste and click "Run"
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE TEST INFRASTRUCTURE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  pass_mark INTEGER NOT NULL DEFAULT 70 CHECK (pass_mark >= 0 AND pass_mark <= 100),
  time_limit_minutes INTEGER CHECK (time_limit_minutes > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES question_packs(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq_single', 'mcq_multi')),
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES question_packs(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score_percent NUMERIC(5,2),
  passed BOOLEAN,
  attempt_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_packs_module_id ON question_packs(module_id);
CREATE INDEX IF NOT EXISTS idx_question_packs_document_id ON question_packs(document_id);
CREATE INDEX IF NOT EXISTS idx_question_packs_active ON question_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_pack_id ON questions(pack_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(pack_id, order_index);
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_correct ON question_options(question_id) WHERE is_correct = true;
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_pack_id ON test_attempts(pack_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_pack ON test_attempts(user_id, pack_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_passed ON test_attempts(user_id, pack_id, passed) WHERE passed = true;
CREATE INDEX IF NOT EXISTS idx_test_attempt_answers_attempt_id ON test_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_test_attempt_answers_question_id ON test_attempt_answers(question_id);

-- Enable RLS
ALTER TABLE question_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempt_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view active question packs" ON question_packs;
CREATE POLICY "Users can view active question packs"
  ON question_packs FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can view questions in active packs" ON questions;
CREATE POLICY "Users can view questions in active packs"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_packs
      WHERE id = questions.pack_id AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view question options" ON question_options;
CREATE POLICY "Users can view question options"
  ON question_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN question_packs qp ON q.pack_id = qp.id
      WHERE q.id = question_options.question_id AND qp.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can view own test attempts" ON test_attempts;
CREATE POLICY "Users can view own test attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own test attempts" ON test_attempts;
CREATE POLICY "Users can create own test attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own test answers" ON test_attempt_answers;
CREATE POLICY "Users can view own test answers"
  ON test_attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_attempts
      WHERE id = test_attempt_answers.attempt_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own test answers" ON test_attempt_answers;
CREATE POLICY "Users can create own test answers"
  ON test_attempt_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_attempts
      WHERE id = test_attempt_answers.attempt_id AND user_id = auth.uid()
    )
  );

-- Permissions
GRANT SELECT ON question_packs TO authenticated, anon;
GRANT SELECT ON questions TO authenticated, anon;
GRANT SELECT ON question_options TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON test_attempts TO authenticated;
GRANT SELECT, INSERT ON test_attempt_answers TO authenticated;

-- ============================================================================
-- PART 2: ADD AUTO-COMPLETION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_complete_training_on_test_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id uuid;
  v_user_auth_id uuid;
BEGIN
  -- Only proceed if the test was passed
  IF NEW.passed = true AND (OLD.passed IS NULL OR OLD.passed = false) THEN

    -- Get the module_id associated with this question pack
    SELECT module_id INTO v_module_id
    FROM question_packs
    WHERE id = NEW.pack_id;

    -- If this pack is linked to a module, update the user's assignment
    IF v_module_id IS NOT NULL THEN

      -- Get the user's auth_id from the users table
      SELECT auth_id INTO v_user_auth_id
      FROM users
      WHERE id = NEW.user_id;

      -- Update the user_assignments record to mark it as completed
      -- Only update if not already completed (to preserve original completion date)
      UPDATE user_assignments
      SET
        completed_at = COALESCE(completed_at, NOW())
      WHERE auth_id = v_user_auth_id
        AND item_id = v_module_id
        AND item_type = 'module';

      -- Log for debugging
      RAISE NOTICE 'Auto-completed training for user % on module % after passing test',
        v_user_auth_id, v_module_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_complete_training_on_test_pass ON test_attempts;

CREATE TRIGGER trigger_auto_complete_training_on_test_pass
  AFTER INSERT OR UPDATE OF passed
  ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_training_on_test_pass();

-- ============================================================================
-- PART 3: BACKFILL EXISTING DATA
-- ============================================================================
-- Update user_assignments for any users who have already passed tests
-- but don't have completed_at set

DO $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  -- Update assignments where user has passed a test but assignment is not marked complete
  WITH passed_tests AS (
    SELECT DISTINCT
      ta.user_id,
      qp.module_id,
      MIN(ta.completed_at) as first_pass_date
    FROM test_attempts ta
    JOIN question_packs qp ON ta.pack_id = qp.id
    WHERE ta.passed = true
      AND qp.module_id IS NOT NULL
    GROUP BY ta.user_id, qp.module_id
  ),
  user_auth_mapping AS (
    SELECT
      u.id as user_id,
      u.auth_id
    FROM users u
  )
  UPDATE user_assignments ua
  SET
    completed_at = pt.first_pass_date
  FROM passed_tests pt
  JOIN user_auth_mapping uam ON pt.user_id = uam.user_id
  WHERE ua.auth_id = uam.auth_id
    AND ua.item_id = pt.module_id
    AND ua.item_type = 'module'
    AND ua.completed_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE 'Backfilled % training assignments with completion dates from passed tests', v_updated_count;
END $$;

-- ============================================================================
-- DONE!
-- ============================================================================
-- The training dashboard should now automatically update when users pass tests
-- ============================================================================
