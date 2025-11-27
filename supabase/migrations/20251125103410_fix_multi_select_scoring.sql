-- Fix Multi-Select Question Scoring
-- This migration updates the submit_attempt functions to properly score multi-select questions
-- by grouping answers by question_id before calculating scores.

-- ============================================================================
-- Helper function to score a single attempt
-- ============================================================================
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
BEGIN
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
    SELECT COALESCE(MAX(attempt_number), 0) + 1
    INTO v_attempt_number
    FROM test_attempts
    WHERE user_id = (SELECT user_id FROM test_attempts WHERE id = p_attempt_id)
      AND pack_id = p_pack_id;

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

-- ============================================================================
-- Update submit_attempt_simple to use new scoring logic
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_attempt_simple(
  p_user_id uuid,
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
  v_attempt_id uuid;
BEGIN
  -- Create the attempt record
  INSERT INTO test_attempts (
    user_id,
    pack_id,
    started_at,
    submitted_at
  )
  VALUES (
    p_user_id,
    p_pack_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_attempt_id;

  -- Insert all answer records (for review purposes)
  INSERT INTO test_attempt_answers (
    attempt_id,
    question_id,
    selected_option_id
  )
  SELECT
    v_attempt_id,
    (elem->>'question_id')::uuid,
    (elem->>'selected_option_id')::uuid
  FROM jsonb_array_elements(p_answers) elem;

  -- Score the attempt using the new scoring function
  RETURN QUERY
  SELECT * FROM score_attempt(v_attempt_id, p_pack_id, p_answers);
END;
$$;

-- ============================================================================
-- Update submit_attempt for JWT mode
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_attempt(
  p_pack_id uuid,
  p_payload jsonb
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
  v_user_id uuid;
  v_attempt_id uuid;
  v_answers jsonb;
BEGIN
  -- Get user from JWT
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Extract answers from payload
  v_answers := p_payload->'answers';

  -- Create the attempt record
  INSERT INTO test_attempts (
    user_id,
    pack_id,
    started_at,
    submitted_at
  )
  VALUES (
    v_user_id,
    p_pack_id,
    (p_payload->>'started_at')::timestamptz,
    (p_payload->>'submitted_at')::timestamptz
  )
  RETURNING id INTO v_attempt_id;

  -- Insert all answer records
  INSERT INTO test_attempt_answers (
    attempt_id,
    question_id,
    selected_option_id
  )
  SELECT
    v_attempt_id,
    (elem->>'question_id')::uuid,
    (elem->>'selected_option_id')::uuid
  FROM jsonb_array_elements(v_answers) elem;

  -- Score the attempt
  RETURN QUERY
  SELECT * FROM score_attempt(v_attempt_id, p_pack_id, v_answers);
END;
$$;

-- ============================================================================
-- Update submit_attempt_as_user for testing mode
-- ============================================================================
CREATE OR REPLACE FUNCTION submit_attempt_as_user(
  p_user_id uuid,
  p_pack_id uuid,
  p_payload jsonb
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
  v_attempt_id uuid;
  v_answers jsonb;
BEGIN
  -- Extract answers from payload
  v_answers := p_payload->'answers';

  -- Create the attempt record
  INSERT INTO test_attempts (
    user_id,
    pack_id,
    started_at,
    submitted_at
  )
  VALUES (
    p_user_id,
    p_pack_id,
    (p_payload->>'started_at')::timestamptz,
    (p_payload->>'submitted_at')::timestamptz
  )
  RETURNING id INTO v_attempt_id;

  -- Insert all answer records
  INSERT INTO test_attempt_answers (
    attempt_id,
    question_id,
    selected_option_id
  )
  SELECT
    v_attempt_id,
    (elem->>'question_id')::uuid,
    (elem->>'selected_option_id')::uuid
  FROM jsonb_array_elements(v_answers) elem;

  -- Score the attempt
  RETURN QUERY
  SELECT * FROM score_attempt(v_attempt_id, p_pack_id, v_answers);
END;
$$;

-- ============================================================================
-- Update get_attempt_review to properly show multi-select answers
-- ============================================================================
CREATE OR REPLACE FUNCTION get_attempt_review(p_attempt_id uuid)
RETURNS TABLE (
  question_id uuid,
  question_text text,
  is_correct boolean,
  selected_option_id uuid,
  selected_answer text,
  correct_option_id uuid,
  correct_answer text,
  points integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_answers AS (
    -- Get all user's selected options for each question
    SELECT
      taa.question_id,
      taa.selected_option_id,
      qo.option_text as selected_answer
    FROM test_attempt_answers taa
    LEFT JOIN question_options qo ON qo.id = taa.selected_option_id
    WHERE taa.attempt_id = p_attempt_id
  ),
  correct_answers AS (
    -- Get all correct options for each question
    SELECT
      qo.question_id,
      qo.id as correct_option_id,
      qo.option_text as correct_answer
    FROM question_options qo
    WHERE qo.is_correct = true
  ),
  question_scoring AS (
    -- Determine if each question was answered correctly
    SELECT
      q.id as question_id,
      q.question_text,
      q.type,
      q.points,
      -- A question is correct if user selected exactly the correct set
      (
        SELECT ARRAY_AGG(ua.selected_option_id::text ORDER BY ua.selected_option_id)
        FROM user_answers ua
        WHERE ua.question_id = q.id
      ) = (
        SELECT ARRAY_AGG(ca.correct_option_id::text ORDER BY ca.correct_option_id)
        FROM correct_answers ca
        WHERE ca.question_id = q.id
      ) as is_correct
    FROM questions q
    WHERE q.pack_id = (
      SELECT pack_id FROM test_attempts WHERE id = p_attempt_id
    )
  )
  -- Return one row per selected option (will be grouped in frontend)
  SELECT
    qs.question_id,
    qs.question_text,
    qs.is_correct,
    ua.selected_option_id,
    ua.selected_answer,
    ca.correct_option_id,
    ca.correct_answer,
    qs.points
  FROM question_scoring qs
  LEFT JOIN user_answers ua ON ua.question_id = qs.question_id
  LEFT JOIN correct_answers ca ON ca.question_id = qs.question_id
  ORDER BY qs.question_id, ua.selected_option_id;
END;
$$;

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION score_attempt TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_attempt_simple TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION submit_attempt_as_user TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_attempt_review TO authenticated, anon;
