-- ============================================================================
-- CREATE TEST/ASSESSMENT INFRASTRUCTURE
-- ============================================================================
-- This migration creates the tables needed for the question pack testing system
-- that integrates with training modules.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create question_packs table
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

COMMENT ON TABLE question_packs IS 'Test/assessment packs that can be linked to training modules or documents';
COMMENT ON COLUMN question_packs.pass_mark IS 'Percentage score required to pass (0-100)';
COMMENT ON COLUMN question_packs.module_id IS 'Optional reference to a training module';
COMMENT ON COLUMN question_packs.document_id IS 'Optional reference to a document';

-- ============================================================================
-- STEP 2: Create questions table
-- ============================================================================

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

COMMENT ON TABLE questions IS 'Questions belonging to question packs';
COMMENT ON COLUMN questions.type IS 'Question type: mcq_single (single choice) or mcq_multi (multiple choice)';
COMMENT ON COLUMN questions.order_index IS 'Display order within the pack';

-- ============================================================================
-- STEP 3: Create question_options table
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE question_options IS 'Answer options for questions';
COMMENT ON COLUMN question_options.is_correct IS 'Whether this option is a correct answer';

-- ============================================================================
-- STEP 4: Create test_attempts table
-- ============================================================================

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

COMMENT ON TABLE test_attempts IS 'User attempts at completing question packs';
COMMENT ON COLUMN test_attempts.score_percent IS 'Final score as a percentage (0-100)';
COMMENT ON COLUMN test_attempts.passed IS 'Whether the attempt passed the pass_mark threshold';
COMMENT ON COLUMN test_attempts.attempt_number IS 'Sequential attempt number for this user/pack combination';

-- ============================================================================
-- STEP 5: Create test_attempt_answers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE test_attempt_answers IS 'Individual answers submitted during a test attempt';

-- ============================================================================
-- STEP 6: Create indexes for performance
-- ============================================================================

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

-- ============================================================================
-- STEP 7: Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE question_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_attempt_answers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: Create RLS Policies
-- ============================================================================

-- Question packs: Users can view active packs
CREATE POLICY IF NOT EXISTS "Users can view active question packs"
  ON question_packs FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Questions: Users can view questions in active packs
CREATE POLICY IF NOT EXISTS "Users can view questions in active packs"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM question_packs
      WHERE id = questions.pack_id AND is_active = true
    )
  );

-- Question options: Users can view options for accessible questions
CREATE POLICY IF NOT EXISTS "Users can view question options"
  ON question_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN question_packs qp ON q.pack_id = qp.id
      WHERE q.id = question_options.question_id AND qp.is_active = true
    )
  );

-- Test attempts: Users can view their own attempts
CREATE POLICY IF NOT EXISTS "Users can view own test attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Test attempts: Users can insert their own attempts
CREATE POLICY IF NOT EXISTS "Users can create own test attempts"
  ON test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Test attempt answers: Users can view their own answers
CREATE POLICY IF NOT EXISTS "Users can view own test answers"
  ON test_attempt_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM test_attempts
      WHERE id = test_attempt_answers.attempt_id AND user_id = auth.uid()
    )
  );

-- Test attempt answers: Users can insert their own answers
CREATE POLICY IF NOT EXISTS "Users can create own test answers"
  ON test_attempt_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_attempts
      WHERE id = test_attempt_answers.attempt_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

GRANT SELECT ON question_packs TO authenticated, anon;
GRANT SELECT ON questions TO authenticated, anon;
GRANT SELECT ON question_options TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON test_attempts TO authenticated;
GRANT SELECT, INSERT ON test_attempt_answers TO authenticated;
