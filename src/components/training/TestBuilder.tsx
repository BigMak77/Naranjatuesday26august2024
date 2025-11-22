"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiArrowUp,
  FiArrowDown,
  FiCopy,
  FiCheck,
  FiX,
  FiList,
  FiEdit
} from "react-icons/fi";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";

/** ---------- Types ---------- */
type QuestionType = "mcq_single" | "mcq_multi" | "true_false" | "short_answer";

interface QuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface TestQuestion {
  id: string;
  question_text: string;
  type: QuestionType;
  points: number;
  order_index: number;
  options: QuestionOption[];
  correct_answer?: string; // For short answer questions
}

interface TestPack {
  id?: string;
  title: string;
  description: string;
  pass_mark: number;
  time_limit_minutes: number | null;
  is_active: boolean;
  module_id?: string | null;
  document_id?: string | null;
  questions: TestQuestion[];
}

interface Module {
  id: string;
  name: string;
}

export default function TestBuilder() {
  const [testPack, setTestPack] = useState<TestPack>({
    title: "",
    description: "",
    pass_mark: 70,
    time_limit_minutes: null,
    is_active: true,
    module_id: null,
    document_id: null,
    questions: []
  });

  const [modules, setModules] = useState<Module[]>([]);
  const [existingPacks, setExistingPacks] = useState<TestPack[]>([]);
  const [editingPackId, setEditingPackId] = useState<string | null>(null);
  const [showExistingTests, setShowExistingTests] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load modules and existing test packs
  useEffect(() => {
    loadModules();
    loadExistingPacks();
  }, []);

  const loadModules = async () => {
    const { data, error } = await supabase
      .from("modules")
      .select("id, name")
      .eq("is_archived", false)
      .order("name");

    if (!error && data) {
      setModules(data);
    }
  };

  const loadExistingPacks = async () => {
    const { data: packs, error } = await supabase
      .from("question_packs")
      .select(`
        id,
        title,
        description,
        pass_mark,
        time_limit_minutes,
        is_active,
        module_id,
        document_id
      `)
      .order("created_at", { ascending: false });

    if (!error && packs) {
      setExistingPacks(packs as TestPack[]);
    }
  };

  const loadPackForEditing = async (packId: string) => {
    try {
      // Load pack with questions and options
      const { data: pack, error: packError } = await supabase
        .from("question_packs")
        .select(`
          id,
          title,
          description,
          pass_mark,
          time_limit_minutes,
          is_active,
          module_id,
          document_id
        `)
        .eq("id", packId)
        .single();

      if (packError) throw packError;

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          type,
          points,
          order_index,
          correct_answer
        `)
        .eq("pack_id", packId)
        .order("order_index");

      if (questionsError) throw questionsError;

      // Load options for each question
      const questionsWithOptions: TestQuestion[] = await Promise.all(
        (questions || []).map(async (q) => {
          const { data: options, error: optionsError } = await supabase
            .from("question_options")
            .select("id, option_text, is_correct, order_index")
            .eq("question_id", q.id)
            .order("order_index");

          if (optionsError) {
            console.error("Error loading options:", optionsError);
          }

          return {
            ...q,
            options: options || []
          };
        })
      );

      setTestPack({
        ...pack,
        questions: questionsWithOptions
      });
      setEditingPackId(packId);
      setShowExistingTests(false);
      setSuccess("Test loaded for editing");
    } catch (err: any) {
      setError(err.message || "Failed to load test");
    }
  };

  const addQuestion = () => {
    const newQuestion: TestQuestion = {
      id: `temp_${Date.now()}`,
      question_text: "",
      type: "mcq_single",
      points: 1,
      order_index: testPack.questions.length,
      options: [
        { id: `opt_${Date.now()}_1`, option_text: "", is_correct: false, order_index: 0 },
        { id: `opt_${Date.now()}_2`, option_text: "", is_correct: false, order_index: 1 }
      ]
    };

    setTestPack(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, field: keyof TestQuestion, value: any) => {
    setTestPack(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setTestPack(prev => ({
      ...prev,
      questions: prev.questions
        .filter(q => q.id !== questionId)
        .map((q, idx) => ({ ...q, order_index: idx }))
    }));
  };

  const moveQuestion = (questionId: string, direction: "up" | "down") => {
    const currentIndex = testPack.questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= testPack.questions.length) return;

    const newQuestions = [...testPack.questions];
    [newQuestions[currentIndex], newQuestions[newIndex]] =
      [newQuestions[newIndex], newQuestions[currentIndex]];

    setTestPack(prev => ({
      ...prev,
      questions: newQuestions.map((q, idx) => ({ ...q, order_index: idx }))
    }));
  };

  const duplicateQuestion = (questionId: string) => {
    const question = testPack.questions.find(q => q.id === questionId);
    if (!question) return;

    const newQuestion: TestQuestion = {
      ...question,
      id: `temp_${Date.now()}`,
      order_index: testPack.questions.length,
      options: question.options.map((opt, idx) => ({
        ...opt,
        id: `opt_${Date.now()}_${idx}`
      }))
    };

    setTestPack(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const addOption = (questionId: string) => {
    setTestPack(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          const newOption: QuestionOption = {
            id: `opt_${Date.now()}_${q.options.length}`,
            option_text: "",
            is_correct: false,
            order_index: q.options.length
          };
          return { ...q, options: [...q.options, newOption] };
        }
        return q;
      })
    }));
  };

  const updateOption = (
    questionId: string,
    optionId: string,
    field: keyof QuestionOption,
    value: any
  ) => {
    setTestPack(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map(opt => {
              if (opt.id === optionId) {
                // If setting is_correct to true and it's mcq_single, uncheck others
                if (field === "is_correct" && value === true && q.type === "mcq_single") {
                  const updatedOptions = q.options.map(o => ({
                    ...o,
                    is_correct: o.id === optionId
                  }));
                  return updatedOptions.find(o => o.id === optionId)!;
                }
                return { ...opt, [field]: value };
              }
              // Uncheck other options for mcq_single
              if (field === "is_correct" && value === true && q.type === "mcq_single") {
                return { ...opt, is_correct: false };
              }
              return opt;
            })
          };
        }
        return q;
      })
    }));
  };

  const deleteOption = (questionId: string, optionId: string) => {
    setTestPack(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options
              .filter(opt => opt.id !== optionId)
              .map((opt, idx) => ({ ...opt, order_index: idx }))
          };
        }
        return q;
      })
    }));
  };

  const validateTestPack = (): string | null => {
    if (!testPack.title.trim()) return "Test title is required";
    if (!testPack.description.trim()) return "Test description is required";
    if (testPack.pass_mark < 0 || testPack.pass_mark > 100) {
      return "Pass mark must be between 0 and 100";
    }
    if (testPack.questions.length === 0) return "At least one question is required";

    for (let i = 0; i < testPack.questions.length; i++) {
      const q = testPack.questions[i];
      if (!q.question_text.trim()) {
        return `Question ${i + 1}: Question text is required`;
      }
      if (q.points <= 0) {
        return `Question ${i + 1}: Points must be greater than 0`;
      }

      if (q.type === "mcq_single" || q.type === "mcq_multi" || q.type === "true_false") {
        if (q.options.length < 2) {
          return `Question ${i + 1}: At least 2 options are required`;
        }
        const hasCorrect = q.options.some(opt => opt.is_correct);
        if (!hasCorrect) {
          return `Question ${i + 1}: At least one correct answer must be selected`;
        }
        for (const opt of q.options) {
          if (!opt.option_text.trim()) {
            return `Question ${i + 1}: All options must have text`;
          }
        }
      }

      if (q.type === "short_answer" && !q.correct_answer?.trim()) {
        return `Question ${i + 1}: Correct answer is required for short answer questions`;
      }
    }

    return null;
  };

  const saveTestPack = async () => {
    setError(null);
    setSuccess(null);

    const validationError = validateTestPack();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      // Save or update the test pack
      const packData = {
        title: testPack.title,
        description: testPack.description,
        pass_mark: testPack.pass_mark,
        time_limit_minutes: testPack.time_limit_minutes,
        is_active: testPack.is_active,
        module_id: testPack.module_id,
        document_id: testPack.document_id
      };

      let packId: string;

      if (editingPackId) {
        // Update existing pack
        const { error: updateError } = await supabase
          .from("question_packs")
          .update(packData)
          .eq("id", editingPackId);

        if (updateError) throw updateError;
        packId = editingPackId;

        // Delete existing questions and options
        const { data: existingQuestions } = await supabase
          .from("questions")
          .select("id")
          .eq("pack_id", packId);

        if (existingQuestions && existingQuestions.length > 0) {
          const questionIds = existingQuestions.map(q => q.id);

          await supabase
            .from("question_options")
            .delete()
            .in("question_id", questionIds);

          await supabase
            .from("questions")
            .delete()
            .eq("pack_id", packId);
        }
      } else {
        // Create new pack
        const { data: newPack, error: insertError } = await supabase
          .from("question_packs")
          .insert(packData)
          .select()
          .single();

        if (insertError) throw insertError;
        packId = newPack.id;
      }

      // Save questions
      for (const question of testPack.questions) {
        const questionData = {
          pack_id: packId,
          question_text: question.question_text,
          type: question.type,
          points: question.points,
          order_index: question.order_index,
          correct_answer: question.type === "short_answer" ? question.correct_answer : null
        };

        const { data: newQuestion, error: questionError } = await supabase
          .from("questions")
          .insert(questionData)
          .select()
          .single();

        if (questionError) throw questionError;

        // Save options (for MCQ and true/false questions)
        if (question.type !== "short_answer" && question.options.length > 0) {
          const optionsData = question.options.map(opt => ({
            question_id: newQuestion.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: opt.order_index
          }));

          const { error: optionsError } = await supabase
            .from("question_options")
            .insert(optionsData);

          if (optionsError) throw optionsError;
        }
      }

      setSuccess(editingPackId ? "Test updated successfully!" : "Test created successfully!");
      setEditingPackId(packId);
      await loadExistingPacks();

      // Reset form after a delay
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save test");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTestPack({
      title: "",
      description: "",
      pass_mark: 70,
      time_limit_minutes: null,
      is_active: true,
      module_id: null,
      document_id: null,
      questions: []
    });
    setEditingPackId(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <ContentHeader
        title="Test Builder"
        description="Create and manage confirmation tests for training modules and documents"
      />

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <TextIconButton
          variant="add"
          icon={<FiList size={16} />}
          label="View Existing Tests"
          onClick={() => setShowExistingTests(true)}
        />
        {editingPackId && (
          <TextIconButton
            variant="cancel"
            icon={<FiX size={16} />}
            label="Cancel Editing"
            onClick={resetForm}
          />
        )}
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          background: "var(--status-danger-light)",
          border: "1px solid var(--status-danger)",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "20px",
          color: "var(--status-danger)",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-base)"
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "var(--status-success-light)",
          border: "1px solid var(--status-success)",
          borderRadius: "6px",
          padding: "12px",
          marginBottom: "20px",
          color: "var(--status-success)",
          fontFamily: "var(--font-family)",
          fontSize: "var(--font-size-base)"
        }}>
          {success}
        </div>
      )}

      {/* Test Pack Details */}
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px"
      }}>
        <h3 style={{
          color: "var(--neon)",
          fontSize: "var(--font-size-header)",
          fontWeight: "var(--font-weight-header)",
          fontFamily: "var(--font-family)",
          marginBottom: "16px"
        }}>
          Test Details
        </h3>

        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <div>
              <label style={{
                display: "block",
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                marginBottom: "6px",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Test Title *
              </label>
              <input
                type="text"
                value={testPack.title}
                onChange={(e) => setTestPack(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Health & Safety Module Quiz"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--field)",
                  color: "var(--text-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-family)",
                  minHeight: "40px",
                  height: "40px"
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                marginBottom: "6px",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Attach to Module (Optional)
              </label>
              <select
                value={testPack.module_id || ""}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  module_id: e.target.value || null
                }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--field)",
                  color: "var(--text-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-family)",
                  minHeight: "40px",
                  height: "40px"
                }}
              >
                <option value="">-- No module --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{
              display: "block",
              color: "var(--text-white)",
              fontWeight: "var(--font-weight-header)",
              marginBottom: "6px",
              fontSize: "var(--font-size-subheader)",
              fontFamily: "var(--font-family)"
            }}>
              Description *
            </label>
            <textarea
              value={testPack.description}
              onChange={(e) => setTestPack(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and content of this test"
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                background: "var(--field)",
                color: "var(--text-white)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-family)",
                resize: "vertical",
                minHeight: "80px"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{
                display: "block",
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                marginBottom: "6px",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Pass Mark (%) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={testPack.pass_mark}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  pass_mark: parseInt(e.target.value) || 0
                }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--field)",
                  color: "var(--text-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-family)",
                  minHeight: "40px",
                  height: "40px"
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                marginBottom: "6px",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Time Limit (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={testPack.time_limit_minutes || ""}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  time_limit_minutes: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="No limit"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--field)",
                  color: "var(--text-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-family)",
                  minHeight: "40px",
                  height: "40px"
                }}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                marginBottom: "6px",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Status
              </label>
              <select
                value={testPack.is_active ? "active" : "inactive"}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  is_active: e.target.value === "active"
                }))}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--field)",
                  color: "var(--text-white)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "var(--font-size-base)",
                  fontFamily: "var(--font-family)",
                  minHeight: "40px",
                  height: "40px"
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h3 style={{
            color: "var(--neon)",
            fontSize: "var(--font-size-header)",
            fontWeight: "var(--font-weight-header)",
            fontFamily: "var(--font-family)"
          }}>
            Questions ({testPack.questions.length})
          </h3>
          <TextIconButton
            variant="add"
            icon={<FiPlus size={16} />}
            label="Add Question"
            onClick={addQuestion}
          />
        </div>

        {testPack.questions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-white)",
            opacity: 0.7,
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            fontFamily: "var(--font-family)",
            fontSize: "var(--font-size-base)"
          }}>
            <p>No questions yet. Click "Add Question" to get started.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {testPack.questions.map((question, qIndex) => (
              <QuestionBuilder
                key={question.id}
                question={question}
                questionNumber={qIndex + 1}
                totalQuestions={testPack.questions.length}
                onUpdate={(field, value) => updateQuestion(question.id, field, value)}
                onDelete={() => deleteQuestion(question.id)}
                onMoveUp={() => moveQuestion(question.id, "up")}
                onMoveDown={() => moveQuestion(question.id, "down")}
                onDuplicate={() => duplicateQuestion(question.id)}
                onAddOption={() => addOption(question.id)}
                onUpdateOption={(optionId, field, value) =>
                  updateOption(question.id, optionId, field, value)
                }
                onDeleteOption={(optionId) => deleteOption(question.id, optionId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
        <TextIconButton
          variant="save"
          icon={saving ? <FiCheck size={16} /> : <FiSave size={16} />}
          label={saving ? "Saving..." : (editingPackId ? "Update Test" : "Save Test")}
          onClick={saveTestPack}
          disabled={saving}
        />
      </div>

      {/* Existing Tests Dialog */}
      {showExistingTests && (
        <OverlayDialog
          open={showExistingTests}
          onClose={() => setShowExistingTests(false)}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: "24px" }}>
            <h2 style={{
              color: "var(--neon)",
              fontSize: "var(--font-size-header)",
              fontWeight: "var(--font-weight-header)",
              fontFamily: "var(--font-family)",
              marginBottom: "20px"
            }}>
              Existing Tests
            </h2>

            {existingPacks.length === 0 ? (
              <p style={{
                color: "var(--text-white)",
                opacity: 0.7,
                fontFamily: "var(--font-family)",
                fontSize: "var(--font-size-base)"
              }}>No tests found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {existingPacks.map(pack => (
                  <div
                    key={pack.id}
                    style={{
                      background: "var(--field)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: "var(--font-weight-header)",
                        color: "var(--text-white)",
                        marginBottom: "4px",
                        fontFamily: "var(--font-family)",
                        fontSize: "var(--font-size-subheader)"
                      }}>
                        {pack.title}
                      </div>
                      <div style={{
                        fontSize: "var(--font-size-base)",
                        color: "var(--text-white)",
                        opacity: 0.8,
                        marginBottom: "4px",
                        fontFamily: "var(--font-family)"
                      }}>
                        {pack.description}
                      </div>
                      <div style={{
                        fontSize: "var(--font-size-base)",
                        color: "var(--text-white)",
                        opacity: 0.7,
                        display: "flex",
                        gap: "12px",
                        fontFamily: "var(--font-family)"
                      }}>
                        <span>Pass: {pack.pass_mark}%</span>
                        {pack.time_limit_minutes && (
                          <span>Time: {pack.time_limit_minutes}m</span>
                        )}
                        <span style={{
                          color: pack.is_active ? "var(--status-success)" : "var(--status-warning)"
                        }}>
                          {pack.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <TextIconButton
                      variant="edit"
                      icon={<FiEdit size={16} />}
                      label="Edit"
                      onClick={() => loadPackForEditing(pack.id!)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </OverlayDialog>
      )}
    </>
  );
}

/** ---------- Question Builder Component ---------- */
interface QuestionBuilderProps {
  question: TestQuestion;
  questionNumber: number;
  totalQuestions: number;
  onUpdate: (field: keyof TestQuestion, value: any) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onAddOption: () => void;
  onUpdateOption: (optionId: string, field: keyof QuestionOption, value: any) => void;
  onDeleteOption: (optionId: string) => void;
}

function QuestionBuilder({
  question,
  questionNumber,
  totalQuestions,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onDeleteOption
}: QuestionBuilderProps) {
  const questionTypes = [
    { value: "mcq_single", label: "Multiple Choice (Single)" },
    { value: "mcq_multi", label: "Multiple Choice (Multiple)" },
    { value: "true_false", label: "True/False" },
    { value: "short_answer", label: "Short Answer" }
  ];

  // Auto-setup True/False options when type changes
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === "true_false" && question.type !== "true_false") {
      onUpdate("options", [
        { id: `opt_true_${Date.now()}`, option_text: "True", is_correct: false, order_index: 0 },
        { id: `opt_false_${Date.now()}`, option_text: "False", is_correct: false, order_index: 1 }
      ]);
    }
    onUpdate("type", newType);
  };

  return (
    <div style={{
      background: "var(--field)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      padding: "16px"
    }}>
      {/* Question Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid var(--border)"
      }}>
        <h4 style={{
          color: "var(--neon)",
          fontSize: "var(--font-size-subheader)",
          fontWeight: "var(--font-weight-header)",
          fontFamily: "var(--font-family)"
        }}>
          Question {questionNumber}
        </h4>
        <div style={{ display: "flex", gap: "6px" }}>
          <TextIconButton
            variant="edit"
            icon={<FiArrowUp size={14} />}
            label=""
            onClick={onMoveUp}
            disabled={questionNumber === 1}
            title="Move up"
          />
          <TextIconButton
            variant="edit"
            icon={<FiArrowDown size={14} />}
            label=""
            onClick={onMoveDown}
            disabled={questionNumber === totalQuestions}
            title="Move down"
          />
          <TextIconButton
            variant="add"
            icon={<FiCopy size={14} />}
            label=""
            onClick={onDuplicate}
            title="Duplicate"
          />
          <TextIconButton
            variant="delete"
            icon={<FiTrash2 size={14} />}
            label=""
            onClick={onDelete}
            title="Delete"
          />
        </div>
      </div>

      {/* Question Details */}
      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px", gap: "12px" }}>
          <div>
            <label style={{
              display: "block",
              color: "var(--text-white)",
              fontWeight: "var(--font-weight-header)",
              marginBottom: "6px",
              fontSize: "var(--font-size-subheader)",
              fontFamily: "var(--font-family)"
            }}>
              Question Type
            </label>
            <select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
              style={{
                width: "100%",
                padding: "8px",
                background: "var(--field)",
                color: "var(--text-white)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-family)",
                minHeight: "40px",
                height: "40px"
              }}
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              color: "var(--text-white)",
              fontWeight: "var(--font-weight-header)",
              marginBottom: "6px",
              fontSize: "var(--font-size-subheader)",
              fontFamily: "var(--font-family)"
            }}>
              Points
            </label>
            <input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => onUpdate("points", parseInt(e.target.value) || 1)}
              style={{
                width: "100%",
                padding: "8px",
                background: "var(--field)",
                color: "var(--text-white)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-family)",
                minHeight: "40px",
                height: "40px"
              }}
            />
          </div>
        </div>

        <div>
          <label style={{
            display: "block",
            color: "var(--text-white)",
            fontWeight: "var(--font-weight-header)",
            marginBottom: "6px",
            fontSize: "var(--font-size-subheader)",
            fontFamily: "var(--font-family)"
          }}>
            Question Text
          </label>
          <textarea
            value={question.question_text}
            onChange={(e) => onUpdate("question_text", e.target.value)}
            placeholder="Enter your question here..."
            rows={2}
            style={{
              width: "100%",
              padding: "8px",
              background: "var(--field)",
              color: "var(--text-white)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "var(--font-size-base)",
              fontFamily: "var(--font-family)",
              resize: "vertical",
              minHeight: "60px"
            }}
          />
        </div>

        {/* Short Answer Field */}
        {question.type === "short_answer" && (
          <div>
            <label style={{
              display: "block",
              color: "var(--text-white)",
              fontWeight: "var(--font-weight-header)",
              marginBottom: "6px",
              fontSize: "var(--font-size-subheader)",
              fontFamily: "var(--font-family)"
            }}>
              Correct Answer
            </label>
            <input
              type="text"
              value={question.correct_answer || ""}
              onChange={(e) => onUpdate("correct_answer", e.target.value)}
              placeholder="Enter the correct answer"
              style={{
                width: "100%",
                padding: "8px",
                background: "var(--field)",
                color: "var(--text-white)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "var(--font-size-base)",
                fontFamily: "var(--font-family)",
                minHeight: "40px",
                height: "40px"
              }}
            />
          </div>
        )}

        {/* Options for MCQ and True/False */}
        {question.type !== "short_answer" && (
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <label style={{
                color: "var(--text-white)",
                fontWeight: "var(--font-weight-header)",
                fontSize: "var(--font-size-subheader)",
                fontFamily: "var(--font-family)"
              }}>
                Answer Options
              </label>
              {question.type !== "true_false" && (
                <TextIconButton
                  variant="add"
                  icon={<FiPlus size={14} />}
                  label="Add Option"
                  onClick={onAddOption}
                />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {question.options.map((option, optIndex) => (
                <div
                  key={option.id}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                  }}
                >
                  <input
                    type={question.type === "mcq_single" ? "radio" : "checkbox"}
                    checked={option.is_correct}
                    onChange={(e) => onUpdateOption(option.id, "is_correct", e.target.checked)}
                    style={{ cursor: "pointer" }}
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    value={option.option_text}
                    onChange={(e) => onUpdateOption(option.id, "option_text", e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    disabled={question.type === "true_false"}
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "var(--field)",
                      color: "var(--text-white)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "var(--font-size-base)",
                      fontFamily: "var(--font-family)",
                      minHeight: "40px",
                      height: "40px"
                    }}
                  />
                  {question.type !== "true_false" && question.options.length > 2 && (
                    <TextIconButton
                      variant="delete"
                      icon={<FiTrash2 size={14} />}
                      label=""
                      onClick={() => onDeleteOption(option.id)}
                      title="Delete option"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
