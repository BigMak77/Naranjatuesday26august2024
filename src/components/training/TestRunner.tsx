"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";

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
};

export default function TestRunner({
  rpcMode = "jwt",
  testingUserId,
  packIds,
}: TestRunnerProps) {
  const [stage, setStage] = useState<"list" | "test" | "result">("list");
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [activePack, setActivePack] = useState<Pack | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // qid -> optionId
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

  function pickOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  /** ---------- Submit answers (robust error handling) ---------- */
  async function submit() {
    if (!activePack) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        started_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
          question_id,
          selected_option_id,
        })),
      };

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

      setReview((reviewRows || []) as ReviewRow[]);
      setStage("result");
    } catch (e: any) {
      setError(e.message ?? "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  const allAnswered = useMemo(() => {
    const qCount = activePack?.questions?.length ?? 0;
    return qCount > 0 && Object.keys(answers).length === qCount;
  }, [answers, activePack?.questions?.length]);

  /** ---------- UI ---------- */
  return (
    <div className="training-container">
      <h1 className="training-h1">Training Tests</h1>

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
                  <button className="neon-btn neon-btn-next" onClick={() => startPack(p.id)}>
                    Start Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stage === "test" && activePack && (
        <>
          <div className="training-card training-info neon-form">
            <div className="training-rowBetween">
              <div>
                <div className="training-title">{activePack.title}</div>
                <div className="training-muted">
                  Answer all questions below. Pass mark: {activePack.pass_mark}%.
                </div>
              </div>
              <button className="neon-btn neon-btn-back" onClick={() => setStage("list")}>Back</button>
            </div>
          </div>

          {(activePack.questions || []).map((q, idx) => (
            <div key={q.id} className="training-qBlock">
              <div className="training-question-title">
                {idx + 1}. {q.question_text}
              </div>
              <div>
                {q.options.map((opt) => {
                  const name = `q-${q.id}`;
                  const checked = answers[q.id] === opt.id;
                  return (
                    <label key={opt.id} className="training-radioRow">
                      <input
                        type="radio"
                        name={name}
                        value={opt.id}
                        checked={!!checked}
                        onChange={() => pickOption(q.id, opt.id)}
                      />
                      <span>{opt.option_text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="training-actions-row">
            <button className="neon-btn neon-btn-back" onClick={() => setStage("list")}>Cancel</button>
            <button
              className="neon-btn neon-btn-next"
              disabled={!allAnswered || loading}
              onClick={submit}
              title={!allAnswered ? "Answer all questions to enable submit" : "Submit your answers"}
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </>
      )}

      {stage === "result" && attempt && review && (
        <>
          <div className="training-card neon-form">
            <div className="training-rowBetween">
              <div>
                <div className="training-title">{activePack?.title}</div>
                <div className="training-score-row">
                  Score: <strong>{attempt.score_percent}%</strong>{' '}
                  {attempt.passed ? (
                    <span className="training-badgePass">Passed</span>
                  ) : (
                    <span className="training-badgeFail">Failed</span>
                  )}{' '}
                  <span className="training-muted" style={{ marginLeft: 8 }}>
                    Attempt #{attempt.attempt_number}
                  </span>
                </div>
              </div>
              <div className="training-actions-row">
                <button className="neon-btn neon-btn-back" onClick={() => setStage("list")}>Close</button>
                <button
                  className="neon-btn neon-btn-next"
                  onClick={() => {
                    if (activePack) startPack(activePack.id);
                  }}
                >
                  Retake
                </button>
              </div>
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
