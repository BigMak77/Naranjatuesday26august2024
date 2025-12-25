"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";

/** ---------- Types mirroring your schema ---------- */
type Option = { id: string; option_text: string; order_index: number };
type Question = {
  id: string;
  question_text: string;
  type: "mcq_single" | "mcq_multi";
  points: number;
  order_index: number;
  options: Option[];
};
type Pack = {
  id: string;
  title: string;
  description?: string | null;
  pass_mark: number;
  time_limit_minutes?: number | null;
  questions?: Question[];
};
type AttemptSummary = {
  attempt_id: string;
  score_percent: number;
  passed: boolean;
  attempt_number: number;
};
type ReviewRow = {
  question_id: string;
  question_text: string;
  is_correct: boolean | null;
  selected_option_id: string | null;
  selected_answer: string | null;
  correct_option_id: string | null;
  correct_answer: string | null;
  points: number;
};

type TestRunnerProps = {
  /**
   * Choose how to submit:
   * - "jwt": uses submit_attempt (requires signed-in user & pack assignment)
   * - "testing": uses submit_attempt_as_user (requires testingUserId & pack assignment)
   * - "simple": uses submit_attempt_simple (no assignments/JWT needed; pass user id)
   * Default is "jwt".
   */
  rpcMode?: "jwt" | "testing" | "simple";
  /** For "testing" or "simple" modes, pass the UUID to record the attempt against */
  testingUserId?: string;
  /** Optional: show only these pack IDs (otherwise inferred from pack_assignments) */
  packIds?: string[];
  /** Optional: callback when user wants to exit back to trainer log */
  onReturnToLog?: () => void;
};

export default function TestRunner({
  rpcMode = "jwt",
  testingUserId,
  packIds,
  onReturnToLog,
}: TestRunnerProps) {
  const [stage, setStage] = useState<"list" | "test" | "result">("list");
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({}); // qid -> optionId or optionIds[]
  const [attempt, setAttempt] = useState<AttemptSummary | null>(null);
  const [review, setReview] = useState<ReviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** ---------- Load packs (either explicit list or via assignments) ---------- */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (packIds && packIds.length > 0) {
          const { data, error } = await supabase
            .from("question_packs")
            .select("id, title, description, pass_mark, time_limit_minutes")
            .in("id", packIds)
            .eq("is_active", true)
            .order("title", { ascending: true });
          if (error) throw error;
          setPacks((data || []) as Pack[]);
        } else {
          // Just show all active packs, no assignment/user logic
          const { data, error } = await supabase
            .from("question_packs")
            .select("id, title, description, pass_mark, time_limit_minutes")
            .eq("is_active", true)
            .order("title", { ascending: true });
          if (error) throw error;
          setPacks((data || []) as Pack[]);
        }
      } catch (e: any) {
        setError(e.message ?? "Failed to load packs");
      } finally {
        setLoading(false);
      }
    })();
  }, [packIds]);

  /** ---------- Load a pack with questions + options ---------- */
  async function startPack(packId: string) {
    setLoading(true);
    setError(null);
    setAttempt(null);
    setReview(null);
    setAnswers({});
    try {
      const { data, error } = await supabase
        .from("question_packs")
        .select(
          `
          id, title, description, pass_mark, time_limit_minutes,
          questions (
            id, question_text, type, points, order_index,
            options:question_options ( id, option_text, order_index )
          )
        `
        )
        .eq("id", packId)
        .single();
      if (error) throw error;

      const sorted: Pack = {
        ...data,
        questions: (data.questions || [])
          .sort((a: Question, b: Question) => a.order_index - b.order_index)
          .map((q: Question) => ({
            ...q,
            options: (q.options || []).sort((a, b) => a.order_index - b.order_index),
          })),
      };

      setActivePack(sorted);
      setStage("test");
    } catch (e: any) {
      setError(e.message ?? "Failed to load test");
    } finally {
      setLoading(false);
    }
  }

  function pickOption(questionId: string, optionId: string, isMulti: boolean) {
    setAnswers((prev) => {
      if (isMulti) {
        // For multi-select questions, toggle the option in the array
        const current = prev[questionId];
        const currentArray = Array.isArray(current) ? current : [];
        const isSelected = currentArray.includes(optionId);

        if (isSelected) {
          // Remove the option
          const updated = currentArray.filter(id => id !== optionId);
          return { ...prev, [questionId]: updated };
        } else {
          // Add the option
          return { ...prev, [questionId]: [...currentArray, optionId] };
        }
      } else {
        // For single-select questions, replace with the new option
        return { ...prev, [questionId]: optionId };
      }
    });
  }

  /** ---------- Submit answers (robust error handling) ---------- */
  async function submit() {
    console.log('🚀 Submit function called');
    console.log('Current answers state:', answers);
    console.log('Active pack:', activePack?.title);
    if (!activePack) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        answers: Object.entries(answers).flatMap(([question_id, answer]) => {
          // Handle both single answers (string) and multiple answers (string[])
          if (Array.isArray(answer)) {
            // For multi-select questions, create an entry for each selected option
            return answer.map(selected_option_id => ({
              question_id,
              selected_option_id,
            }));
          } else {
            // For single-select questions, create one entry
            return [{
              question_id,
              selected_option_id: answer,
            }];
          }
        }),
      };

      // Debug logging
      console.log('Submitting test with answers:', {
        totalQuestions: activePack.questions?.length,
        answerEntries: payload.answers.length,
        answers: payload.answers
      });

      let rpcName: "submit_attempt" | "submit_attempt_as_user" | "submit_attempt_simple";
      let args: Record<string, any>;

      if (rpcMode === "testing") {
        if (!testingUserId) throw new Error("testingUserId is required in 'testing' mode.");
        rpcName = "submit_attempt_as_user";
        args = { p_user_id: testingUserId, p_pack_id: activePack.id, p_payload: payload };
      } else if (rpcMode === "simple") {
        if (!testingUserId) throw new Error("testingUserId is required in 'simple' mode.");
        rpcName = "submit_attempt_simple";
        // NOTE: submit_attempt_simple signature: (p_user_id uuid, p_pack_id uuid, p_answers jsonb)
        args = { p_user_id: testingUserId, p_pack_id: activePack.id, p_answers: payload.answers };
      } else {
        // jwt mode
        // Optional guard to ensure we are signed in
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr || !authData?.user) throw new Error("Not signed in.");
        rpcName = "submit_attempt";
        args = { p_pack_id: activePack.id, p_payload: payload };
      }

      const { data, error } = await supabase.rpc(rpcName, args);

      // Debug logging for response
      console.log('Test submission result:', { data, error });

      if (error) {
        console.error("RPC error:", error);
        throw new Error(error.message || "Submission failed");
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.error("RPC returned no data", { rpcName, args, data });
        const modeMsg =
          rpcMode === "jwt"
            ? "Are you assigned to this pack and is the pack active?"
            : "Is the user assigned to this pack (testing) or did you pass the correct parameters (simple)?";
        throw new Error(`Submission returned no result. ${modeMsg}`);
      }

      // Supabase returns array for set-returning functions
      const row = (Array.isArray(data) ? data[0] : data) as Partial<AttemptSummary> | null;
      if (!row || !row.attempt_id) {
        console.error("Missing attempt_id in RPC result", row);
        throw new Error("Submission did not produce an attempt (check function, RLS, and inputs).");
      }

      setAttempt(row as AttemptSummary);

      // fetch review details
      const { data: reviewRows, error: err2 } = await supabase.rpc("get_attempt_review", {
        p_attempt_id: row.attempt_id,
      });
      if (err2) {
        console.error("Review RPC error:", err2);
        throw new Error(err2.message || "Failed to load review");
      }

      // Group review rows by question_id for multi-select questions
      const groupedReview = groupReviewByQuestion((reviewRows || []) as ReviewRow[]);
      setReview(groupedReview);
      setStage("result");
    } catch (e: any) {
      setError(e.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  /** Group review rows by question to handle multi-select answers */
  function groupReviewByQuestion(reviewRows: ReviewRow[]): ReviewRow[] {
    const grouped = new Map<string, ReviewRow>();

    reviewRows.forEach(row => {
      const existing = grouped.get(row.question_id);
      if (existing) {
        // Combine multiple selected answers for the same question
        if (row.selected_answer) {
          const currentAnswers = existing.selected_answer ? existing.selected_answer.split(', ') : [];
          if (!currentAnswers.includes(row.selected_answer)) {
            currentAnswers.push(row.selected_answer);
            existing.selected_answer = currentAnswers.join(', ');
          }
        }
        // Keep is_correct as false if any answer is incorrect
        if (existing.is_correct && !row.is_correct) {
          existing.is_correct = false;
        }
      } else {
        // First occurrence of this question
        grouped.set(row.question_id, { ...row });
      }
    });

    return Array.from(grouped.values());
  }

  const allAnswered = useMemo(() => {
    const questions = activePack?.questions ?? [];
    if (questions.length === 0) return false;

    // Check that every question has at least one answer
    return questions.every(q => {
      const answer = answers[q.id];
      if (!answer) return false;

      // For multi-select, ensure at least one option is selected
      if (Array.isArray(answer)) {
        return answer.length > 0;
      }

      // For single-select, ensure an option is selected
      return typeof answer === 'string' && answer.length > 0;
    });
  }, [answers, activePack?.questions]);

  /** ---------- UI ---------- */
  return (
    <div className="training-container">
      {stage === "list" && <h1 className="training-h1">Training Tests</h1>}
      {stage === "test" && activePack && (
        <h1 className="training-h1">{activePack.title} - Pass Mark: {activePack.pass_mark}%</h1>
      )}
      {stage === "result" && activePack && (
        <h1 className="training-h1">{activePack.title} - Pass Mark: {activePack.pass_mark}%</h1>
      )}

      {error && (
        <div className="training-card training-danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {stage === "list" && (
        <>
          <h2 className="training-h2">Assigned</h2>
          {loading && <div className="training-muted">Loading…</div>}
          {!loading && packs.length === 0 && <div className="training-muted">No tests found.</div>}

          <div className="training-list">
            {packs.map((p) => (
              <div key={p.id} className="training-card neon-form">
                <div className="training-rowBetween">
                  <div>
                    <div className="training-title">{p.title}</div>
                    {!!p.description && <div className="training-muted">{p.description}</div>}
                    <div className="training-pill-row">
                      <span className="training-pill">Pass mark: {p.pass_mark}%</span>
                      {p.time_limit_minutes ? (
                        <span className="training-pill">Time limit: {p.time_limit_minutes}m</span>
                      ) : null}
                    </div>
                  </div>
                  <TextIconButton
                    variant="next"
                    label="Start Test"
                    onClick={() => startPack(p.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stage === "test" && activePack && (
        <>

          {(activePack.questions || []).map((q, idx) => {
            const isMulti = q.type === "mcq_multi";
            const currentAnswer = answers[q.id];

            return (
              <div key={q.id} className="training-qBlock">
                <div className="training-question-title">
                  {idx + 1}. {q.question_text}
                  {isMulti && <span className="training-muted">(Select all that apply)</span>}
                </div>
                <div>
                  {q.options.map((opt) => {
                    const name = `q-${q.id}`;
                    let checked = false;

                    if (isMulti) {
                      checked = Array.isArray(currentAnswer) && currentAnswer.includes(opt.id);
                    } else {
                      checked = currentAnswer === opt.id;
                    }

                    return (
                      <label key={opt.id} className="training-radioRow">
                        <input
                          type={isMulti ? "checkbox" : "radio"}
                          name={isMulti ? undefined : name}
                          value={opt.id}
                          checked={!!checked}
                          onChange={() => pickOption(q.id, opt.id, isMulti)}
                        />
                        <span>{opt.option_text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="training-actions-row">
            <TextIconButton
              variant="cancel"
              label="Cancel"
              onClick={() => setStage("list")}
            />
            <TextIconButton
              variant="submit"
              label={loading ? "Submitting…" : "Submit"}
              onClick={submit}
              disabled={!allAnswered || loading}
              title={!allAnswered ? "Answer all questions to enable submit" : "Submit your answers"}
            />
          </div>
        </>
      )}

      {stage === "result" && attempt && review && (
        <>
          <div className="training-card neon-form">
            <div className="training-rowBetween">
              <div>
                <div className="training-score-row">
                  Score: <strong>{attempt.score_percent}%</strong>{' '}
                  {attempt.passed ? (
                    <span className="training-badgePass">Passed</span>
                  ) : (
                    <span className="training-badgeFail">Failed</span>
                  )}{' '}
                  <span className="training-muted">
                    Attempt #{attempt.attempt_number}
                  </span>
                </div>

                {/* Pass/Fail specific messages */}
                {attempt.passed ? (
                  <div className="neon-success-banner">
                    Congratulations! You have successfully passed this test. You may return to the test list or review your answers below.
                  </div>
                ) : (
                  <div className="neon-error-banner">
                    You did not meet the pass mark of {activePack?.pass_mark}%. Please review the correct answers below and retake the test.
                  </div>
                )}
              </div>

              {!attempt.passed && (
                <div className="training-actions-row">
                  <TextIconButton
                    variant="next"
                    label="Retake Test"
                    onClick={() => {
                      if (activePack) startPack(activePack.id);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="training-card neon-form">
            <div className="training-review-title">Review</div>
            <table className="training-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Your answer</th>
                  <th>Correct answer</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {review.map((r) => (
                  <tr key={r.question_id}>
                    <td>{r.question_text}</td>
                    <td>{r.selected_answer ?? <span className="training-muted">—</span>}</td>
                    <td>{r.correct_answer ?? <span className="training-muted">—</span>}</td>
                    <td>
                      {r.is_correct ? (
                        <span className="training-badgePass">Correct</span>
                      ) : (
                        <span className="training-badgeFail">Incorrect</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
