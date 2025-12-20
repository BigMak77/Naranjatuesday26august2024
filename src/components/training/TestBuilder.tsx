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
  FiEdit,
  FiArchive,
  FiRotateCcw
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
  is_archived?: boolean;
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
  const [showArchivedTests, setShowArchivedTests] = useState(false);
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<TestQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [packToArchive, setPackToArchive] = useState<TestPack | null>(null);
  const [packToRestore, setPackToRestore] = useState<TestPack | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

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

  const loadExistingPacks = async (includeArchived = false) => {
    let query = supabase
      .from("question_packs")
      .select(`
        id,
        title,
        description,
        pass_mark,
        time_limit_minutes,
        is_active,
        is_archived,
        module_id,
        document_id
      `);

    if (!includeArchived) {
      // Show non-archived tests (is_archived is false or null for backward compatibility)
      query = query.or("is_archived.is.null,is_archived.eq.false");
    } else {
      // Show only archived tests
      query = query.eq("is_archived", true);
    }

    const { data: packs, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading test packs:", error);
      setError(`Failed to load tests: ${error.message}`);
      setExistingPacks([]);
    } else if (packs) {
      console.log(`Loaded ${packs.length} ${includeArchived ? 'archived' : 'active'} test packs:`, packs);
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
          is_archived,
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

  const openAddQuestionDialog = () => {
    const question: TestQuestion = {
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
    setNewQuestion(question);
    setEditingQuestionId(null);
    setShowAddQuestionDialog(true);
  };

  const openEditQuestionDialog = (questionId: string) => {
    const question = testPack.questions.find(q => q.id === questionId);
    if (!question) return;
    setNewQuestion({ ...question });
    setEditingQuestionId(questionId);
    setShowAddQuestionDialog(true);
  };

  const confirmAddQuestion = () => {
    if (!newQuestion) return;

    // Validate question
    if (!newQuestion.question_text.trim()) {
      setError("Question text is required");
      return;
    }

    if (newQuestion.type !== "short_answer") {
      const hasCorrect = newQuestion.options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        setError("At least one correct answer must be selected");
        return;
      }
      const hasEmptyOption = newQuestion.options.some(opt => !opt.option_text.trim());
      if (hasEmptyOption) {
        setError("All options must have text");
        return;
      }
    } else if (!newQuestion.correct_answer?.trim()) {
      setError("Correct answer is required for short answer questions");
      return;
    }

    if (editingQuestionId) {
      // Update existing question
      setTestPack(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === editingQuestionId ? newQuestion : q
        )
      }));
      setSuccess("Question updated successfully!");
    } else {
      // Add new question
      setTestPack(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
      setSuccess("Question added successfully!");
    }

    setShowAddQuestionDialog(false);
    setNewQuestion(null);
    setEditingQuestionId(null);
    setError(null);
    setTimeout(() => setSuccess(null), 2000);
  };

  const cancelAddQuestion = () => {
    setShowAddQuestionDialog(false);
    setNewQuestion(null);
    setEditingQuestionId(null);
    setError(null);
  };

  const updateNewQuestion = (field: keyof TestQuestion, value: any) => {
    if (!newQuestion) return;
    setNewQuestion({ ...newQuestion, [field]: value });
  };

  const addOptionToNewQuestion = () => {
    if (!newQuestion) return;
    const newOption: QuestionOption = {
      id: `opt_${Date.now()}_${newQuestion.options.length}`,
      option_text: "",
      is_correct: false,
      order_index: newQuestion.options.length
    };
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, newOption]
    });
  };

  const updateNewQuestionOption = (
    optionId: string,
    field: keyof QuestionOption,
    value: any
  ) => {
    if (!newQuestion) return;
    const isSingleAnswer = newQuestion.type === "mcq_single" || newQuestion.type === "true_false";

    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.map(opt => {
        if (opt.id === optionId) {
          // If setting is_correct to true and it's single answer type, uncheck others
          if (field === "is_correct" && value === true && isSingleAnswer) {
            const updatedOptions = newQuestion.options.map(o => ({
              ...o,
              is_correct: o.id === optionId
            }));
            return updatedOptions.find(o => o.id === optionId)!;
          }
          return { ...opt, [field]: value };
        }
        // Uncheck other options for single answer types
        if (field === "is_correct" && value === true && isSingleAnswer) {
          return { ...opt, is_correct: false };
        }
        return opt;
      })
    });
  };

  const deleteNewQuestionOption = (optionId: string) => {
    if (!newQuestion) return;
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options
        .filter(opt => opt.id !== optionId)
        .map((opt, idx) => ({ ...opt, order_index: idx }))
    });
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
          const isSingleAnswer = q.type === "mcq_single" || q.type === "true_false";
          return {
            ...q,
            options: q.options.map(opt => {
              if (opt.id === optionId) {
                // If setting is_correct to true and it's single answer type, uncheck others
                if (field === "is_correct" && value === true && isSingleAnswer) {
                  const updatedOptions = q.options.map(o => ({
                    ...o,
                    is_correct: o.id === optionId
                  }));
                  return updatedOptions.find(o => o.id === optionId)!;
                }
                return { ...opt, [field]: value };
              }
              // Uncheck other options for single answer types
              if (field === "is_correct" && value === true && isSingleAnswer) {
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

  const archiveTestPack = async (pack: TestPack) => {
    if (!pack.id) return;
    setArchiveLoading(true);
    console.log("Archiving test pack:", pack.id, pack.title);

    try {
      const { data, error } = await supabase
        .from("question_packs")
        .update({
          is_archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pack.id)
        .select();

      console.log("Archive result:", { data, error });

      if (error) {
        console.error("Archive error:", error);
        setError(`Failed to archive test: ${error.message}`);
      } else {
        console.log("Archive successful, reloading packs...");
        setSuccess("Test archived successfully!");
        setShowExistingTests(false); // Close the existing tests dialog
        setPackToArchive(null); // Close confirmation dialog
        await loadExistingPacks(); // Reload active tests
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      console.error("Archive exception:", err);
      setError("An error occurred while archiving the test");
    } finally {
      setArchiveLoading(false);
    }
  };

  const restoreTestPack = async (pack: TestPack) => {
    if (!pack.id) return;
    setArchiveLoading(true);
    console.log("Restoring test pack:", pack.id, pack.title);

    try {
      const { data, error } = await supabase
        .from("question_packs")
        .update({
          is_archived: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pack.id)
        .select();

      console.log("Restore result:", { data, error });

      if (error) {
        console.error("Restore error:", error);
        setError(`Failed to restore test: ${error.message}`);
      } else {
        console.log("Restore successful, reloading packs...");
        setSuccess("Test restored successfully!");
        setShowArchivedTests(false); // Close the archived tests dialog
        setPackToRestore(null); // Close confirmation dialog
        await loadExistingPacks(true); // Reload archived tests to verify it's gone
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      console.error("Restore exception:", err);
      setError("An error occurred while restoring the test");
    } finally {
      setArchiveLoading(false);
    }
  };

  const cloneTestPack = async (pack: TestPack) => {
    if (!pack.id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Cloning test pack:", pack.id, pack.title);

      // Load the complete pack data including questions and options
      const { data: fullPack, error: packError } = await supabase
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
        .eq("id", pack.id)
        .single();

      if (packError) throw packError;

      // Load questions
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
        .eq("pack_id", pack.id)
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

      // Create the cloned pack data
      const clonedPackData = {
        title: `Duplicate - ${fullPack.title}`,
        description: fullPack.description,
        pass_mark: fullPack.pass_mark,
        time_limit_minutes: fullPack.time_limit_minutes,
        is_active: false, // Start as inactive
        module_id: fullPack.module_id,
        document_id: fullPack.document_id
      };

      // Insert the cloned pack
      const { data: newPack, error: insertError } = await supabase
        .from("question_packs")
        .insert(clonedPackData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Clone all questions
      for (const question of questionsWithOptions) {
        const questionData = {
          pack_id: newPack.id,
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

        // Clone options for MCQ and true/false questions
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

      setSuccess(`Test "${fullPack.title}" cloned successfully!`);
      await loadExistingPacks(); // Reload to show the new cloned test
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error("Clone error:", err);
      setError(`Failed to clone test: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
          onClick={() => {
            loadExistingPacks(false);
            setShowExistingTests(true);
          }}
        />
        <TextIconButton
          variant="view"
          icon={<FiArchive size={16} />}
          label="View Archived Tests"
          onClick={() => {
            loadExistingPacks(true);
            setShowArchivedTests(true);
          }}
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
      {error && <div className="training-card training-danger">{error}</div>}
      {success && <div className="training-card training-badgePass">{success}</div>}

      {/* Test Pack Details */}
      <div className="neon-panel" style={{ marginBottom: "20px" }}>
        <h3>Test Details</h3>

        <div style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            <label>
              Test Title *
              <input
                className="neon-input"
                type="text"
                value={testPack.title}
                onChange={(e) => setTestPack(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Health & Safety Module Quiz"
                required
              />
            </label>

            <label>
              Attach to Module (Optional)
              <select
                className="neon-input"
                value={testPack.module_id || ""}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  module_id: e.target.value || null
                }))}
              >
                <option value="">-- No module --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Description *
            <textarea
              className="neon-input"
              value={testPack.description}
              onChange={(e) => setTestPack(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the purpose and content of this test"
              rows={3}
              required
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <label>
              Pass Mark (%) *
              <input
                className="neon-input"
                type="number"
                min="0"
                max="100"
                value={testPack.pass_mark}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  pass_mark: parseInt(e.target.value) || 0
                }))}
                required
              />
            </label>

            <label>
              Time Limit (minutes)
              <input
                className="neon-input"
                type="number"
                min="0"
                value={testPack.time_limit_minutes || ""}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  time_limit_minutes: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="No limit"
              />
            </label>

            <label>
              Status
              <select
                className="neon-input"
                value={testPack.is_active ? "active" : "inactive"}
                onChange={(e) => setTestPack(prev => ({
                  ...prev,
                  is_active: e.target.value === "active"
                }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="neon-panel" style={{ marginBottom: "20px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <h3>Questions ({testPack.questions.length})</h3>
          <TextIconButton
            variant="add"
            icon={<FiPlus size={16} />}
            label="Add Question"
            onClick={openAddQuestionDialog}
          />
        </div>

        {testPack.questions.length === 0 ? (
          <div className="neon-info" style={{ textAlign: "center", padding: "40px" }}>
            <p>No questions yet. Click "Add Question" to get started.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {testPack.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className="neon-panel"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <strong>Q{qIndex + 1}:</strong>
                    <span style={{ opacity: 0.7, fontSize: "var(--font-size-base)" }}>
                      {question.type === "mcq_single" && "Multiple Choice (Single)"}
                      {question.type === "mcq_multi" && "Multiple Choice (Multiple)"}
                      {question.type === "true_false" && "True/False"}
                      {question.type === "short_answer" && "Short Answer"}
                    </span>
                    <span style={{ opacity: 0.7, fontSize: "var(--font-size-base)" }}>
                      • {question.points} {question.points === 1 ? "point" : "points"}
                    </span>
                  </div>
                  <p style={{ margin: 0 }}>{question.question_text}</p>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <TextIconButton
                    variant="edit"
                    icon={<FiEdit size={14} />}
                    label=""
                    onClick={() => openEditQuestionDialog(question.id)}
                    title="Edit question"
                  />
                  <TextIconButton
                    variant="delete"
                    icon={<FiTrash2 size={14} />}
                    label=""
                    onClick={() => deleteQuestion(question.id)}
                    title="Delete question"
                  />
                </div>
              </div>
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

      {/* Add Question Dialog */}
      {showAddQuestionDialog && newQuestion && (
        <OverlayDialog
          open={showAddQuestionDialog}
          onClose={cancelAddQuestion}
          showCloseButton={true}
          width={800}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "80vh", 
            maxHeight: "800px" 
          }}>
            <div style={{ padding: "24px 24px 0 24px", flexShrink: 0 }}>
              <h2>{editingQuestionId ? "Edit Question" : "Add New Question"}</h2>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "16px 24px",
              minHeight: 0
            }}>
              <QuestionBuilder
                question={newQuestion}
                questionNumber={editingQuestionId
                  ? testPack.questions.findIndex(q => q.id === editingQuestionId) + 1
                  : testPack.questions.length + 1}
                totalQuestions={testPack.questions.length + 1}
                onUpdate={updateNewQuestion}
                onDelete={() => {}}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onDuplicate={() => {}}
                onAddOption={addOptionToNewQuestion}
                onUpdateOption={updateNewQuestionOption}
                onDeleteOption={deleteNewQuestionOption}
                hideActions={true}
              />
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              padding: "20px 24px 24px 24px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
              backgroundColor: "var(--background)"
            }}>
              <TextIconButton
                variant="cancel"
                icon={<FiX size={16} />}
                label="Cancel"
                onClick={cancelAddQuestion}
              />
              <TextIconButton
                variant="save"
                icon={<FiCheck size={16} />}
                label={editingQuestionId ? "Update Question" : "Add Question"}
                onClick={confirmAddQuestion}
              />
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Existing Tests Dialog */}
      {showExistingTests && (
        <OverlayDialog
          open={showExistingTests}
          onClose={() => setShowExistingTests(false)}
          showCloseButton={true}
          width={900}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "80vh", 
            maxHeight: "700px" 
          }}>
            <div style={{ padding: "24px 24px 0 24px", flexShrink: 0 }}>
              <h2>Existing Tests</h2>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "16px 24px 24px 24px",
              minHeight: 0
            }}>
              {existingPacks.length === 0 ? (
                <p className="neon-info">No tests found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {existingPacks.map(pack => (
                    <div
                      key={pack.id}
                      className="neon-panel"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: "4px" }}>{pack.title}</h4>
                        <p style={{ marginBottom: "4px", opacity: 0.8 }}>
                          {pack.description}
                        </p>
                        <div style={{
                          display: "flex",
                          gap: "12px",
                          opacity: 0.7
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
                      <div style={{ display: "flex", gap: "8px" }}>
                        <TextIconButton
                          variant="edit"
                          icon={<FiEdit size={16} />}
                          label="Edit"
                          onClick={() => loadPackForEditing(pack.id!)}
                        />
                        <TextIconButton
                          variant="add"
                          icon={<FiCopy size={16} />}
                          label="Clone"
                          onClick={() => cloneTestPack(pack)}
                          disabled={saving}
                          title="Create a duplicate copy of this test"
                        />
                        <TextIconButton
                          variant="archive"
                          icon={<FiArchive size={16} />}
                          label="Archive"
                          onClick={() => setPackToArchive(pack)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Archived Tests Dialog */}
      {showArchivedTests && (
        <OverlayDialog
          open={showArchivedTests}
          onClose={() => setShowArchivedTests(false)}
          showCloseButton={true}
          width={900}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "80vh", 
            maxHeight: "700px" 
          }}>
            <div style={{ padding: "24px 24px 0 24px", flexShrink: 0 }}>
              <h2>Archived Tests</h2>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "16px 24px 24px 24px",
              minHeight: 0
            }}>
              {existingPacks.length === 0 ? (
                <p className="neon-info">No archived tests found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {existingPacks.map(pack => (
                    <div
                      key={pack.id}
                      className="neon-panel"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ marginBottom: "4px" }}>{pack.title}</h4>
                        <p style={{ marginBottom: "4px", opacity: 0.8 }}>
                          {pack.description}
                        </p>
                        <div style={{
                          display: "flex",
                          gap: "12px",
                          opacity: 0.7
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
                      <div style={{ display: "flex", gap: "8px" }}>
                        <TextIconButton
                          variant="edit"
                          icon={<FiEdit size={16} />}
                          label="Edit"
                          onClick={() => loadPackForEditing(pack.id!)}
                        />
                        <TextIconButton
                          variant="add"
                          icon={<FiCopy size={16} />}
                          label="Clone"
                          onClick={() => cloneTestPack(pack)}
                          disabled={saving}
                          title="Create a duplicate copy of this test"
                        />
                        <TextIconButton
                          variant="save"
                          icon={<FiRotateCcw size={16} />}
                          label="Restore"
                          onClick={() => setPackToRestore(pack)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Archive Confirmation Dialog */}
      {packToArchive && (
        <OverlayDialog
          open={true}
          onClose={() => setPackToArchive(null)}
          showCloseButton={true}
          width={500}
        >
          <div style={{ padding: "24px" }}>
            <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.25rem", marginBottom: "16px" }}>
              Confirm Archive
            </h3>
            <p style={{ marginBottom: "24px", fontSize: "1rem", lineHeight: 1.5 }}>
              Are you sure you want to archive{" "}
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {packToArchive.title}
              </span>
              ? This will remove it from the active tests list.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="cancel"
                icon={<FiX size={16} />}
                label="Cancel"
                onClick={() => setPackToArchive(null)}
                disabled={archiveLoading}
              />
              <TextIconButton
                variant="archive"
                icon={<FiArchive size={16} />}
                label={archiveLoading ? "Archiving..." : "Archive"}
                onClick={() => archiveTestPack(packToArchive)}
                disabled={archiveLoading}
              />
            </div>
          </div>
        </OverlayDialog>
      )}

      {/* Restore Confirmation Dialog */}
      {packToRestore && (
        <OverlayDialog
          open={true}
          onClose={() => setPackToRestore(null)}
          showCloseButton={true}
          width={500}
        >
          <div style={{ padding: "24px" }}>
            <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.25rem", marginBottom: "16px" }}>
              Confirm Restore
            </h3>
            <p style={{ marginBottom: "24px", fontSize: "1rem", lineHeight: 1.5 }}>
              Are you sure you want to restore{" "}
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {packToRestore.title}
              </span>
              ? This will make it available in the active tests list.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <TextIconButton
                variant="cancel"
                icon={<FiX size={16} />}
                label="Cancel"
                onClick={() => setPackToRestore(null)}
                disabled={archiveLoading}
              />
              <TextIconButton
                variant="save"
                icon={<FiRotateCcw size={16} />}
                label={archiveLoading ? "Restoring..." : "Restore"}
                onClick={() => restoreTestPack(packToRestore)}
                disabled={archiveLoading}
              />
            </div>
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
  hideActions?: boolean;
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
  onDeleteOption,
  hideActions = false
}: QuestionBuilderProps) {
  const questionTypes = [
    { value: "mcq_single", label: "Multiple Choice (Single)" },
    { value: "mcq_multi", label: "Multiple Choice (Multiple)" },
    { value: "true_false", label: "True/False" },
    { value: "short_answer", label: "Short Answer" }
  ];

  // Auto-setup True/False options when type changes
  const handleTypeChange = (newType: QuestionType) => {
    onUpdate("type", newType);
    if (newType === "true_false" && question.type !== "true_false") {
      onUpdate("options", [
        { id: `opt_true_${Date.now()}`, option_text: "True", is_correct: false, order_index: 0 },
        { id: `opt_false_${Date.now()}`, option_text: "False", is_correct: false, order_index: 1 }
      ]);
    }
  };

  return (
    <div className="neon-panel">
      {/* Question Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid var(--border)"
      }}>
        <h4>Question {questionNumber}</h4>
        {!hideActions && (
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
        )}
      </div>

      {/* Question Details */}
      <div style={{ display: "grid", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
          <label>
            Question Type
            <select
              className="neon-input"
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Points
            <input
              className="neon-input"
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => onUpdate("points", parseInt(e.target.value) || 1)}
            />
          </label>
        </div>

        <label>
          Question Text
          <textarea
            className="neon-input"
            value={question.question_text}
            onChange={(e) => onUpdate("question_text", e.target.value)}
            placeholder="Enter your question here..."
            rows={2}
          />
        </label>

        {/* Short Answer Field */}
        {question.type === "short_answer" && (
          <label>
            Correct Answer
            <input
              className="neon-input"
              type="text"
              value={question.correct_answer || ""}
              onChange={(e) => onUpdate("correct_answer", e.target.value)}
              placeholder="Enter the correct answer"
            />
          </label>
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
              <label className="neon-label">Answer Options</label>
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
                    type={question.type === "mcq_single" || question.type === "true_false" ? "radio" : "checkbox"}
                    name={question.type === "mcq_single" || question.type === "true_false" ? `question_${question.id}` : undefined}
                    checked={option.is_correct}
                    onChange={(e) => onUpdateOption(option.id, "is_correct", e.target.checked)}
                    style={{ cursor: "pointer" }}
                    title="Mark as correct answer"
                  />
                  <input
                    className="neon-input"
                    type="text"
                    value={option.option_text}
                    onChange={(e) => onUpdateOption(option.id, "option_text", e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    disabled={question.type === "true_false"}
                    style={{ flex: 1 }}
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
