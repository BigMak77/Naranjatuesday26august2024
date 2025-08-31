// components/QuestionTab.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import QuestionEditor from "./QuestionEditor";
import type { Question, Department } from "@/types";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiPlus } from "react-icons/fi";

export default function QuestionTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const [qRes, dRes] = await Promise.all([
      supabase
        .from("audit_questions")
        .select("*")
        .order("question_text", { ascending: true }),
      supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    if (qRes.error) {
      console.error("audit_questions load error:", qRes.error);
      setErr(qRes.error.message);
      setQuestions([]);
    } else {
      setQuestions((qRes.data as Question[]) ?? []);
    }

    if (dRes.error) {
      console.error("departments load error:", dRes.error);
      setDepartments([]);
      setErr((prev) => prev || dRes.error.message);
    } else {
      setDepartments((dRes.data as Department[]) ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateQuestion = async (
    id: string,
    field: keyof Question,
    value: unknown,
  ) => {
    setErr(null);
    const patch: Partial<Question> = { [field]: value };

    const { error } = await supabase
      .from("audit_questions")
      .update(patch)
      .eq("id", id);

    if (error) {
      console.error("updateQuestion error:", error);
      setErr(error.message);
      return;
    }

    setQuestions((prev) =>
      prev
        .map((q) => (q.id === id ? { ...q, ...patch } : q))
        .sort((a, b) =>
          (a.question_text || "").localeCompare(b.question_text || ""),
        ),
    );
  };

  const removeQuestion = async (id: string) => {
    setErr(null);
    const { error } = await supabase
      .from("audit_questions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("removeQuestion error:", error);
      setErr(error.message);
      return;
    }

    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addQuestion = async () => {
    setErr(null);
    // Use a non-empty default to avoid NOT NULL or CHECK constraints
    const { data, error } = await supabase
      .from("audit_questions")
      .insert({ question_text: "New question", fail_department_id: null })
      .select()
      .single();

    if (error) {
      console.error("addQuestion error:", error);
      setErr(error.message);
      return;
    }

    if (data) {
      setQuestions((prev) =>
        [...prev, data as Question].sort((a, b) =>
          (a.question_text || "").localeCompare(b.question_text || ""),
        ),
      );
    }
  };

  const bulkAddQuestions = async (bulkText: string) => {
    setErr(null);
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const rows = lines.map((question_text) => ({
      question_text,
      fail_department_id: null,
    }));

    const { data, error } = await supabase
      .from("audit_questions")
      .insert(rows)
      .select();

    if (error) {
      console.error("bulkAddQuestions error:", error);
      setErr(error.message);
      return;
    }

    if (data) {
      setQuestions((prev) =>
        [...prev, ...(data as Question[])].sort((a, b) =>
          (a.question_text || "").localeCompare(b.question_text || ""),
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="neon-loading-message">
        Loading questions...
      </div>
    );
  }

  return (
    <div>
      {err && <div className="neon-error-message">{err}</div>}

      <QuestionEditor
        questions={questions}
        departments={departments}
        updateQuestion={updateQuestion}
        removeQuestion={removeQuestion}
        addQuestion={addQuestion}
        bulkAddQuestions={bulkAddQuestions}
      />
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Question" onClick={addQuestion} className="neon-add-btn" />
    </div>
  );
}
