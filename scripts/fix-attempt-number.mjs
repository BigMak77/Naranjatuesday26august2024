import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://gkpkpwppzrztmgdltdwf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrcGtwd3BwenJ6dG1nZGx0ZHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTk2MDY3NywiZXhwIjoyMDQ3NTM2Njc3fQ.qWLKuYhIBO_4F38FXq0i9aVZkuE_vcA9h-cKdoF-RMg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Applying fix for attempt_number ambiguity...');

const sql = `
-- Fix ambiguous column reference in score_attempt function
CREATE OR REPLACE FUNCTION score_attempt(
  p_attempt_id uuid,
  p_pack_id uuid,
  p_answers jsonb
)
RETURNS TABLE (
  attempt_id uuid,
  score_percent numeric,
  passed boolean,
  attempt_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass_mark integer;
  v_total_questions integer;
  v_correct_questions integer := 0;
  v_question record;
  v_user_answers text[];
  v_correct_answers text[];
  v_attempt_number integer;
  v_user_id uuid;
BEGIN
  -- Get user_id from the attempt
  SELECT ta.user_id INTO v_user_id
  FROM test_attempts ta
  WHERE ta.id = p_attempt_id;

  -- Get pack details
  SELECT pass_mark INTO v_pass_mark
  FROM question_packs
  WHERE id = p_pack_id;

  -- Count total questions in pack
  SELECT COUNT(*) INTO v_total_questions
  FROM questions
  WHERE pack_id = p_pack_id;

  -- If no questions, return 0 score
  IF v_total_questions = 0 THEN
    RAISE EXCEPTION 'No questions found for pack %', p_pack_id;
  END IF;

  -- Loop through each question in the pack
  FOR v_question IN
    SELECT id, type
    FROM questions
    WHERE pack_id = p_pack_id
  LOOP
    -- Get user's selected options for this question (grouped)
    SELECT ARRAY_AGG(DISTINCT elem->>'selected_option_id')
    INTO v_user_answers
    FROM jsonb_array_elements(p_answers) elem
    WHERE elem->>'question_id' = v_question.id::text;

    -- Get correct options for this question
    SELECT ARRAY_AGG(id::text ORDER BY id)
    INTO v_correct_answers
    FROM question_options
    WHERE question_id = v_question.id
      AND is_correct = true;

    -- Score the question based on type
    IF v_question.type IN ('mcq_single', 'mcq_multi') THEN
      -- For both single and multi-select:
      -- Correct only if selected set exactly matches correct set
      IF v_user_answers IS NOT NULL
         AND v_correct_answers IS NOT NULL
         AND (
           -- Sort and compare arrays
           (SELECT ARRAY_AGG(x ORDER BY x) FROM unnest(v_user_answers) x) =
           (SELECT ARRAY_AGG(x ORDER BY x) FROM unnest(v_correct_answers) x)
         ) THEN
        v_correct_questions := v_correct_questions + 1;
      END IF;
    END IF;
  END LOOP;

  -- Calculate score percentage
  DECLARE
    v_score_percent numeric;
    v_passed boolean;
  BEGIN
    v_score_percent := ROUND((v_correct_questions::numeric / v_total_questions::numeric * 100), 2);
    v_passed := v_score_percent >= v_pass_mark;

    -- Get attempt number for this user/pack combination
    -- Use explicit table alias to avoid ambiguity
    SELECT COALESCE(MAX(ta.attempt_number), 0) + 1
    INTO v_attempt_number
    FROM test_attempts ta
    WHERE ta.user_id = v_user_id
      AND ta.pack_id = p_pack_id;

    -- Update the attempt with scores
    UPDATE test_attempts
    SET
      score_percent = v_score_percent,
      passed = v_passed,
      attempt_number = v_attempt_number,
      completed_at = NOW()
    WHERE id = p_attempt_id;

    -- Return the results
    RETURN QUERY
    SELECT
      p_attempt_id,
      v_score_percent,
      v_passed,
      v_attempt_number;
  END;
END;
$$;
`;

try {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error executing SQL:', error);

    // Try direct query approach
    console.log('🔄 Trying alternative approach...');
    const { error: error2 } = await supabase.from('_migrations').select('*').limit(0);

    if (!error2) {
      console.log('✅ Database connection successful');
      console.log('📝 Please run the migration file manually or through Supabase dashboard');
      console.log('Migration file: supabase/migrations/20251220150000_fix_attempt_number_ambiguity.sql');
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n📝 Manual migration required:');
  console.log('Please apply: supabase/migrations/20251220150000_fix_attempt_number_ambiguity.sql');
  console.log('You can run it in the Supabase SQL Editor dashboard');
}
