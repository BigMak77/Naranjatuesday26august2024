"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";
import ContentHeader from "@/components/ui/ContentHeader";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import OverlayDialog from "@/components/ui/OverlayDialog";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import jsPDF from "jspdf";

/* ===========================
   TRAINING TEST RESULTS VIEWER
   View and filter completed tests, answers, and results
=========================== */

// Type definitions based on database schema
type TestAttempt = {
  attempt_id: string;
  pack_id: string;
  user_id: string;
  score_percent: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  // Joined data
  pack_title: string;
  user_name: string;
  user_employee_number: string;
  department_name: string;
  module_id: string | null;
  module_name: string | null;
};

type TestAnswer = {
  question_id: string;
  question_text: string;
  is_correct: boolean | null;
  selected_option_id: string | null;
  selected_answer: string | null;
  correct_option_id: string | null;
  correct_answer: string | null;
  points: number;
};

type FilterOption = {
  id: string;
  name: string;
};

export default function TrainingTestResults() {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter options
  const [users, setUsers] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [modules, setModules] = useState<FilterOption[]>([]);
  const [packs, setPacks] = useState<FilterOption[]>([]);

  // Selected filters
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<"all" | "pass" | "fail">("all");
  const [attemptNumberFilter, setAttemptNumberFilter] = useState<string>("");

  // Detail view
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<TestAnswer[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load filter options and data on mount
  useEffect(() => {
    loadFilterOptions();
    loadAttempts();
  }, []);

  // Apply filters whenever selections change
  useEffect(() => {
    applyFilters();
  }, [
    attempts,
    selectedUsers,
    selectedDepartments,
    selectedModules,
    selectedPacks,
    selectedResult,
    attemptNumberFilter,
  ]);

  // Load filter dropdown options
  const loadFilterOptions = async () => {
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, first_name, last_name, employee_number")
        .order("last_name", { ascending: true });

      if (usersError) throw usersError;
      setUsers(
        (usersData || []).map((u) => ({
          id: u.id,
          name: `${u.first_name} ${u.last_name} (${u.employee_number})`,
        }))
      );

      // Load departments
      const { data: deptsData, error: deptsError } = await supabase
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true });

      if (deptsError) throw deptsError;
      setDepartments(
        (deptsData || []).map((d) => ({
          id: d.id,
          name: d.name,
        }))
      );

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, name")
        .eq("is_archived", false)
        .order("name", { ascending: true });

      if (modulesError) throw modulesError;
      setModules(
        (modulesData || []).map((m) => ({
          id: m.id,
          name: m.name,
        }))
      );

      // Load test packs
      const { data: packsData, error: packsError } = await supabase
        .from("question_packs")
        .select("id, title")
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (packsError) throw packsError;
      setPacks(
        (packsData || []).map((p) => ({
          id: p.id,
          name: p.title,
        }))
      );
    } catch (err: any) {
      console.error("Error loading filter options:", err);
      setError(err.message || "Failed to load filter options");
    }
  };

  // Load all test attempts with related data
  const loadAttempts = async () => {
    setLoading(true);
    setError(null);
    try {
      // First, get all test attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("id, pack_id, user_id, score_percent, passed, attempt_number, started_at, submitted_at, completed_at")
        .order("completed_at", { ascending: false });

      if (attemptsError) throw attemptsError;

      if (!attemptsData || attemptsData.length === 0) {
        setAttempts([]);
        return;
      }

      // Remove any duplicates by attempt ID (shouldn't happen but safety check)
      const uniqueAttempts = Array.from(
        new Map(attemptsData.map((a) => [a.id, a])).values()
      );

      // Get unique pack IDs and user IDs
      const packIds = [...new Set(uniqueAttempts.map((a) => a.pack_id))];
      const userIds = [...new Set(uniqueAttempts.map((a) => a.user_id))];

      // Fetch question packs
      const { data: packsData } = await supabase
        .from("question_packs")
        .select("id, title, module_id")
        .in("id", packIds);

      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("id, first_name, last_name, employee_number, department_id")
        .in("id", userIds);

      // Get unique module IDs and department IDs
      const moduleIds = [...new Set((packsData || []).map((p: any) => p.module_id).filter(Boolean))];
      const departmentIds = [...new Set((usersData || []).map((u: any) => u.department_id).filter(Boolean))];

      // Fetch modules
      const { data: modulesData } = await supabase
        .from("modules")
        .select("id, name")
        .in("id", moduleIds.length > 0 ? moduleIds : ["00000000-0000-0000-0000-000000000000"]);

      // Fetch departments
      const { data: deptsData } = await supabase
        .from("departments")
        .select("id, name")
        .in("id", departmentIds.length > 0 ? departmentIds : ["00000000-0000-0000-0000-000000000000"]);

      // Create lookup maps
      const packMap = new Map((packsData || []).map((p: any) => [p.id, p]));
      const userMap = new Map((usersData || []).map((u: any) => [u.id, u]));
      const moduleMap = new Map((modulesData || []).map((m: any) => [m.id, m.name]));
      const deptMap = new Map((deptsData || []).map((d: any) => [d.id, d.name]));

      // Transform the data
      const transformedData: TestAttempt[] = uniqueAttempts.map((attempt) => {
        const pack = packMap.get(attempt.pack_id);
        const user = userMap.get(attempt.user_id);

        return {
          attempt_id: attempt.id,
          pack_id: attempt.pack_id,
          user_id: attempt.user_id,
          score_percent: attempt.score_percent,
          passed: attempt.passed,
          attempt_number: attempt.attempt_number,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          completed_at: attempt.completed_at,
          pack_title: pack?.title || "Unknown",
          user_name: user ? `${user.first_name} ${user.last_name}`.trim() : "Unknown",
          user_employee_number: user?.employee_number || "",
          department_name: user?.department_id ? deptMap.get(user.department_id) || "Unknown" : "Unknown",
          module_id: pack?.module_id || null,
          module_name: pack?.module_id ? moduleMap.get(pack.module_id) || null : null,
        };
      });

      setAttempts(transformedData);
    } catch (err: any) {
      console.error("Error loading test attempts:", err);
      setError(err.message || "Failed to load test attempts");
    } finally {
      setLoading(false);
    }
  };

  // Apply all active filters
  const applyFilters = () => {
    let filtered = [...attempts];

    // Remove any potential duplicates by attempt_id
    filtered = Array.from(
      new Map(filtered.map((a) => [a.attempt_id, a])).values()
    );

    // Filter by user
    if (selectedUsers.length > 0) {
      filtered = filtered.filter((a) => selectedUsers.includes(a.user_id));
    }

    // Filter by department
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((a) => {
        // Find the user's department from the user data
        const user = attempts.find((att) => att.user_id === a.user_id);
        const userDeptId = user ? user.department_name : "";
        return selectedDepartments.some((deptId) => {
          const dept = departments.find((d) => d.id === deptId);
          return dept?.name === userDeptId;
        });
      });
    }

    // Filter by module
    if (selectedModules.length > 0) {
      filtered = filtered.filter((a) => {
        if (!a.module_name) return false;
        return selectedModules.some((modId) => {
          const mod = modules.find((m) => m.id === modId);
          return mod?.name === a.module_name;
        });
      });
    }

    // Filter by test pack
    if (selectedPacks.length > 0) {
      filtered = filtered.filter((a) => selectedPacks.includes(a.pack_id));
    }

    // Filter by result (pass/fail)
    if (selectedResult === "pass") {
      filtered = filtered.filter((a) => a.passed);
    } else if (selectedResult === "fail") {
      filtered = filtered.filter((a) => !a.passed);
    }

    // Filter by attempt number
    if (attemptNumberFilter) {
      const attemptNum = parseInt(attemptNumberFilter, 10);
      if (!isNaN(attemptNum)) {
        filtered = filtered.filter((a) => a.attempt_number === attemptNum);
      }
    }

    // Final deduplication before setting state
    const finalFiltered = Array.from(
      new Map(filtered.map((a) => [a.attempt_id, a])).values()
    );

    setFilteredAttempts(finalFiltered);
  };

  // Load detailed answers for a specific attempt
  const loadAttemptDetail = async (attemptId: string) => {
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase.rpc("get_attempt_review", {
        p_attempt_id: attemptId,
      });

      if (error) throw error;

      // Group answers by question_id since the RPC returns one row per option
      const groupedAnswers = groupAnswersByQuestion(data || []);
      setAttemptAnswers(groupedAnswers);
    } catch (err: any) {
      console.error("Error loading attempt detail:", err);
      setError(err.message || "Failed to load attempt details");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Group multiple answer rows by question_id
  const groupAnswersByQuestion = (rawAnswers: any[]): TestAnswer[] => {
    const questionMap = new Map<string, any>();

    rawAnswers.forEach((row) => {
      const qId = row.question_id;

      if (!questionMap.has(qId)) {
        // First time seeing this question
        questionMap.set(qId, {
          question_id: qId,
          question_text: row.question_text,
          is_correct: row.is_correct,
          points: row.points,
          selected_answers: [],
          correct_answers: [],
          selected_option_ids: [],
          correct_option_ids: [],
        });
      }

      const question = questionMap.get(qId);

      // Add selected answer if not already added
      if (row.selected_option_id && row.selected_answer) {
        if (!question.selected_option_ids.includes(row.selected_option_id)) {
          question.selected_answers.push(row.selected_answer);
          question.selected_option_ids.push(row.selected_option_id);
        }
      }

      // Add correct answer if not already added
      if (row.correct_option_id && row.correct_answer) {
        if (!question.correct_option_ids.includes(row.correct_option_id)) {
          question.correct_answers.push(row.correct_answer);
          question.correct_option_ids.push(row.correct_option_id);
        }
      }
    });

    // Convert to final format
    return Array.from(questionMap.values()).map((q) => ({
      question_id: q.question_id,
      question_text: q.question_text,
      is_correct: q.is_correct,
      selected_option_id: q.selected_option_ids[0] || null,
      selected_answer: q.selected_answers.join(", "),
      correct_option_id: q.correct_option_ids[0] || null,
      correct_answer: q.correct_answers.join(", "),
      points: q.points,
    }));
  };

  // View attempt details
  const handleViewDetail = async (attempt: TestAttempt) => {
    setSelectedAttempt(attempt);
    setShowDetailDialog(true);
    await loadAttemptDetail(attempt.attempt_id);
  };

  // Download PDF of test attempt with signatures
  const handleDownloadPDF = async (attempt: TestAttempt) => {
    try {
      // Fetch training log data with signatures for this module/user
      // Training logs are stored with topic=module_id, not item_id
      let trainingLog = null;

      if (attempt.module_id) {
        const { data: trainingLogs, error: logError } = await supabase
          .from("training_logs")
          .select("*")
          .eq("auth_id", attempt.user_id)
          .eq("topic", attempt.module_id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (logError) {
          console.error("Error fetching training log:", logError);
        } else {
          trainingLog = trainingLogs?.[0];
        }
      }

      // Create PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Add logo watermark
      try {
        const logoImg = new Image();
        logoImg.src = "/4d turq logo.png";
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = reject;
          // Add timeout to prevent hanging
          setTimeout(() => reject(new Error("Logo load timeout")), 3000);
        });

        // Add watermark centered and semi-transparent
        const logoWidth = 80;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        const logoX = (pageWidth - logoWidth) / 2;
        const logoY = (pageHeight - logoHeight) / 2;

        // Save current graphics state
        doc.saveGraphicsState();
        // Set opacity using setGState
        (doc as any).setGState((doc as any).GState({ opacity: 0.1 }));
        doc.addImage(logoImg, "PNG", logoX, logoY, logoWidth, logoHeight);
        // Restore graphics state
        doc.restoreGraphicsState();
      } catch (e) {
        console.warn("Could not load logo watermark:", e);
      }

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Training Test Results", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Test Information
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Test: ${attempt.pack_title}`, 20, yPos);
      yPos += 7;
      if (attempt.module_name) {
        doc.text(`Module: ${attempt.module_name}`, 20, yPos);
        yPos += 7;
      }
      doc.text(`User: ${attempt.user_name} (${attempt.user_employee_number})`, 20, yPos);
      yPos += 7;
      doc.text(`Department: ${attempt.department_name}`, 20, yPos);
      yPos += 7;
      doc.text(`Completed: ${attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : "N/A"}`, 20, yPos);
      yPos += 10;

      // Test Results
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Results", 20, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Score: ${attempt.score_percent.toFixed(1)}%`, 20, yPos);
      yPos += 7;

      doc.setFont("helvetica", "bold");
      if (attempt.passed) {
        doc.setTextColor(0, 128, 0);
        doc.text("Result: PASS", 20, yPos);
      } else {
        doc.setTextColor(255, 0, 0);
        doc.text("Result: FAIL", 20, yPos);
      }
      doc.setTextColor(0, 0, 0);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.text(`Attempt Number: ${attempt.attempt_number}`, 20, yPos);
      yPos += 15;

      // Questions and Answers
      if (attemptAnswers.length > 0) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Questions & Answers", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        attemptAnswers.forEach((answer, idx) => {
          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = 20;
          }

          // Question number and text
          doc.setFont("helvetica", "bold");
          doc.text(`${idx + 1}. ${answer.question_text}`, 20, yPos, { maxWidth: pageWidth - 40 });
          yPos += 7;

          // User's answer
          doc.setFont("helvetica", "normal");
          if (answer.is_correct) {
            doc.setTextColor(0, 128, 0);
            doc.text(`✓ Your answer: ${answer.selected_answer || "No answer"}`, 25, yPos);
          } else {
            doc.setTextColor(255, 0, 0);
            doc.text(`✗ Your answer: ${answer.selected_answer || "No answer"}`, 25, yPos);
          }
          yPos += 6;

          // Correct answer if wrong
          if (!answer.is_correct && answer.correct_answer) {
            doc.setTextColor(0, 128, 0);
            doc.text(`  Correct answer: ${answer.correct_answer}`, 25, yPos);
            yPos += 6;
          }

          doc.setTextColor(0, 0, 0);
          doc.text(`  Points: ${answer.points}`, 25, yPos);
          yPos += 10;
        });
      }

      // Add signatures if available
      if (trainingLog) {
        // Check if we need a new page for signatures
        if (yPos > pageHeight - 80) {
          doc.addPage();
          yPos = 20;
        }

        yPos += 10;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Training Record Signatures", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        if (trainingLog.date) {
          doc.text(`Training Date: ${trainingLog.date}`, 20, yPos);
          yPos += 7;
        }

        if (trainingLog.signature) {
          doc.text("Learner Signature:", 20, yPos);
          yPos += 2;
          try {
            doc.addImage(trainingLog.signature, "PNG", 20, yPos, 60, 20);
            yPos += 25;
          } catch (e) {
            yPos += 7;
          }
        }

        if (trainingLog.trainer_signature) {
          doc.text("Trainer Signature:", 20, yPos);
          yPos += 2;
          try {
            doc.addImage(trainingLog.trainer_signature, "PNG", 20, yPos, 60, 20);
            yPos += 25;
          } catch (e) {
            yPos += 7;
          }
        }

        if (trainingLog.translator_signature) {
          doc.text("Translator Signature:", 20, yPos);
          yPos += 2;
          try {
            doc.addImage(trainingLog.translator_signature, "PNG", 20, yPos, 60, 20);
            yPos += 25;
          } catch (e) {
            yPos += 7;
          }
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Save PDF
      doc.save(`test-result-${attempt.user_employee_number}-${attempt.pack_title.replace(/[^a-z0-9]/gi, '-')}.pdf`);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredAttempts.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Attempt ID",
      "User",
      "Employee Number",
      "Department",
      "Test",
      "Module",
      "Score %",
      "Passed",
      "Attempt #",
      "Completed At",
    ];

    const rows = filteredAttempts.map((a) => [
      a.attempt_id,
      a.user_name,
      a.user_employee_number,
      a.department_name,
      a.pack_title,
      a.module_name || "N/A",
      a.score_percent.toFixed(2),
      a.passed ? "Yes" : "No",
      a.attempt_number,
      a.completed_at ? new Date(a.completed_at).toLocaleString() : "N/A",
    ]);

    const csvContent =
      [headers.join(",")]
        .concat(rows.map((row) => row.map((cell) => `"${cell}"`).join(",")))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `test-results-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedUsers([]);
    setSelectedDepartments([]);
    setSelectedModules([]);
    setSelectedPacks([]);
    setSelectedResult("all");
    setAttemptNumberFilter("");
  };

  // Table columns configuration
  const columns = [
    {
      header: "User",
      accessor: "user_name",
      render: (value: unknown, row: Record<string, unknown>) => {
        return (
          <div>
            <div className="font-medium">{value as string}</div>
            <div className="text-xs text-gray-400">{row.user_employee_number as string}</div>
          </div>
        );
      },
    },
    {
      header: "Department",
      accessor: "department_name",
    },
    {
      header: "Test",
      accessor: "pack_title",
      render: (value: unknown, row: Record<string, unknown>) => {
        const moduleName = row.module_name;
        return (
          <div>
            <div className="font-medium">{value as string}</div>
            {moduleName && typeof moduleName === 'string' ? (
              <div className="text-xs text-gray-400">Module: {moduleName}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      header: "Score",
      accessor: "score_percent",
      align: "center" as const,
      render: (value: unknown) => {
        return <span className="font-mono">{(value as number).toFixed(1)}%</span>;
      },
    },
    {
      header: "Result",
      accessor: "passed",
      align: "center" as const,
      render: (value: unknown) => {
        return value ? (
          <span className="flex items-center justify-center gap-1 text-green-400">
            <FiCheckCircle /> Pass
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1 text-red-400">
            <FiXCircle /> Fail
          </span>
        );
      },
    },
    {
      header: "Attempt #",
      accessor: "attempt_number",
      align: "center" as const,
    },
    {
      header: "Completed",
      accessor: "completed_at",
      render: (value: unknown) => {
        return value ? new Date(value as string).toLocaleString() : "N/A";
      },
    },
    {
      header: "Actions",
      accessor: "attempt_id",
      align: "center" as const,
      render: (_value: unknown, row: Record<string, unknown>) => {
        return (
          <TextIconButton
            variant="view"
            label="View"
            onClick={() => handleViewDetail(row as unknown as TestAttempt)}
          />
        );
      },
    },
  ];

  const activeFilterCount =
    (selectedUsers.length > 0 ? 1 : 0) +
    (selectedDepartments.length > 0 ? 1 : 0) +
    (selectedModules.length > 0 ? 1 : 0) +
    (selectedPacks.length > 0 ? 1 : 0) +
    (selectedResult !== "all" ? 1 : 0) +
    (attemptNumberFilter ? 1 : 0);

  return (
    <div className="training-test-results">
      <ContentHeader title="Training Test Results" />

      {error && (
        <div className="neon-panel bg-red-950/30 border-red-500 p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="neon-panel p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 flex flex-wrap gap-3">
            {/* User filter */}
            <MultiSelectDropdown
              options={users}
              selectedIds={selectedUsers}
              onChange={setSelectedUsers}
              placeholder="Filter by User"
              label="Users"
            />

            {/* Department filter */}
            <MultiSelectDropdown
              options={departments}
              selectedIds={selectedDepartments}
              onChange={setSelectedDepartments}
              placeholder="Filter by Department"
              label="Departments"
            />

            {/* Module filter */}
            <MultiSelectDropdown
              options={modules}
              selectedIds={selectedModules}
              onChange={setSelectedModules}
              placeholder="Filter by Module"
              label="Modules"
            />

            {/* Test pack filter */}
            <MultiSelectDropdown
              options={packs}
              selectedIds={selectedPacks}
              onChange={setSelectedPacks}
              placeholder="Filter by Test"
              label="Tests"
            />

            {/* Result filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Result</label>
              <select
                className="neon-input px-3 py-2"
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value as "all" | "pass" | "fail")}
              >
                <option value="all">All Results</option>
                <option value="pass">Pass Only</option>
                <option value="fail">Fail Only</option>
              </select>
            </div>

            {/* Attempt number filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Attempt #</label>
              <input
                type="number"
                min="1"
                className="neon-input px-3 py-2 w-24"
                placeholder="Any"
                value={attemptNumberFilter}
                onChange={(e) => setAttemptNumberFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <TextIconButton
                variant="cancel"
                label={`Clear (${activeFilterCount})`}
                onClick={clearFilters}
              />
            )}
            <TextIconButton variant="refresh" label="Refresh" onClick={loadAttempts} />
            <TextIconButton variant="download" label="Export CSV" onClick={handleExport} />
          </div>
        </div>
      </div>

      {/* Results summary */}
      <div className="neon-panel p-4 mb-4">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Total Attempts:</span>{" "}
            <span className="font-bold text-cyan-400">{filteredAttempts.length}</span>
          </div>
          <div>
            <span className="text-gray-400">Passed:</span>{" "}
            <span className="font-bold text-green-400">
              {filteredAttempts.filter((a) => a.passed).length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Failed:</span>{" "}
            <span className="font-bold text-red-400">
              {filteredAttempts.filter((a) => !a.passed).length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Avg Score:</span>{" "}
            <span className="font-bold text-cyan-400">
              {filteredAttempts.length > 0
                ? (
                    filteredAttempts.reduce((sum, a) => sum + a.score_percent, 0) /
                    filteredAttempts.length
                  ).toFixed(1)
                : "0.0"}
              %
            </span>
          </div>
        </div>
      </div>

      {/* Results table */}
      {loading ? (
        <div className="neon-panel p-8 text-center">
          <div className="animate-pulse text-cyan-400">Loading test results...</div>
        </div>
      ) : (
        <NeonTable
          columns={columns}
          data={filteredAttempts as unknown as Record<string, unknown>[]}
          rowKey="attempt_id"
        />
      )}

      {/* Detail dialog */}
      {showDetailDialog && selectedAttempt && (
        <OverlayDialog
          open={showDetailDialog}
          onClose={() => {
            setShowDetailDialog(false);
            setSelectedAttempt(null);
            setAttemptAnswers([]);
          }}
        >
          <div className="space-y-4">
            {/* Dialog title and actions */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-cyan-400">
                Test Attempt Details: {selectedAttempt.pack_title}
              </h2>
              <TextIconButton
                variant="download"
                label="Download PDF"
                onClick={() => handleDownloadPDF(selectedAttempt)}
              />
            </div>

            {/* Attempt summary */}
            <div className="neon-panel p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">User:</span>{" "}
                  <span className="font-medium">
                    {selectedAttempt.user_name} ({selectedAttempt.user_employee_number})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Department:</span>{" "}
                  <span className="font-medium">{selectedAttempt.department_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Test:</span>{" "}
                  <span className="font-medium">{selectedAttempt.pack_title}</span>
                </div>
                <div>
                  <span className="text-gray-400">Module:</span>{" "}
                  <span className="font-medium">{selectedAttempt.module_name || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400">Score:</span>{" "}
                  <span className="font-bold text-cyan-400">
                    {selectedAttempt.score_percent.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Result:</span>{" "}
                  {selectedAttempt.passed ? (
                    <span className="font-bold text-green-400">PASS</span>
                  ) : (
                    <span className="font-bold text-red-400">FAIL</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400">Attempt #:</span>{" "}
                  <span className="font-medium">{selectedAttempt.attempt_number}</span>
                </div>
                <div>
                  <span className="text-gray-400">Completed:</span>{" "}
                  <span className="font-medium">
                    {selectedAttempt.completed_at
                      ? new Date(selectedAttempt.completed_at).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Answers */}
            {loadingDetail ? (
              <div className="text-center py-8 text-gray-400">Loading answers...</div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-cyan-400">Questions & Answers</h3>
                {attemptAnswers.map((answer, idx) => (
                  <div
                    key={answer.question_id}
                    className={`neon-panel p-4 ${
                      answer.is_correct
                        ? "border-green-500/30 bg-green-950/10"
                        : "border-red-500/30 bg-red-950/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {answer.is_correct ? (
                          <FiCheckCircle className="text-green-400 text-xl" />
                        ) : (
                          <FiXCircle className="text-red-400 text-xl" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">
                          {idx + 1}. {answer.question_text}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-gray-400">Your answer:</span>{" "}
                            <span
                              className={answer.is_correct ? "text-green-400" : "text-red-400"}
                            >
                              {answer.selected_answer || "No answer"}
                            </span>
                          </div>
                          {!answer.is_correct && (
                            <div>
                              <span className="text-gray-400">Correct answer:</span>{" "}
                              <span className="text-green-400">{answer.correct_answer}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Points:</span>{" "}
                            <span className="font-mono">{answer.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OverlayDialog>
      )}
    </div>
  );
}
