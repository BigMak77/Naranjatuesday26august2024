"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiSearch, FiChevronDown, FiChevronRight, FiFileText } from "react-icons/fi";

type Module = {
  id: string;
  name: string;
  description: string;
};

type QuestionPack = {
  id: string;
  title: string;
  pass_mark: number;
  module_id: string | null;
  document_id: string | null;
};

type Question = {
  id: string;
  pack_id: string;
  question_text: string;
  type: string;
  points: number;
  order_index: number;
};

type QuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
};

type ModuleWithTests = {
  module: Module;
  questionPacks: Array<{
    pack: QuestionPack;
    questions: Array<{
      question: Question;
      options: QuestionOption[];
    }>;
  }>;
};

export default function TrainingWithTest() {
  const [modules, setModules] = useState<Module[]>([]);
  const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [modulesRes, packsRes, questionsRes, optionsRes] = await Promise.all([
        supabase.from("modules").select("*").order("name", { ascending: true }),
        supabase.from("question_packs").select("*").not("module_id", "is", null),
        supabase.from("questions").select("*").order("pack_id, order_index"),
        supabase.from("question_options").select("*"),
      ]);

      if (modulesRes.data) setModules(modulesRes.data);
      if (packsRes.data) setQuestionPacks(packsRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (optionsRes.data) setQuestionOptions(optionsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const modulesWithTests: ModuleWithTests[] = useMemo(() => {
    return modules
      .map((module) => {
        const modulePacks = questionPacks.filter((pack) => pack.module_id === module.id);

        const packsWithQuestions = modulePacks.map((pack) => {
          const packQuestions = questions.filter((q) => q.pack_id === pack.id);

          const questionsWithOptions = packQuestions.map((question) => {
            const options = questionOptions.filter((opt) => opt.question_id === question.id);
            return { question, options };
          });

          return { pack, questions: questionsWithOptions };
        });

        return { module, questionPacks: packsWithQuestions };
      })
      .filter((m) => m.questionPacks.length > 0);
  }, [modules, questionPacks, questions, questionOptions]);

  const filteredModules = useMemo(() => {
    return modulesWithTests.filter((m) =>
      m.module.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modulesWithTests, searchTerm]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const togglePack = (packId: string) => {
    setExpandedPacks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(packId)) {
        newSet.delete(packId);
      } else {
        newSet.add(packId);
      }
      return newSet;
    });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "mcq_single":
        return "Single Choice";
      case "mcq_multi":
        return "Multiple Choice";
      case "short_answer":
        return "Short Answer";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-white)" }}>
        Loading training modules with tests...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 24px" }}>
      {/* Header */}
      <div
        style={{
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            color: "var(--text-white)",
            fontSize: "var(--font-size-header)",
            fontWeight: "var(--font-weight-header)",
            marginBottom: "0.5rem",
          }}
        >
          Training Modules with Tests
        </h1>
        <p style={{ color: "var(--text-white)", opacity: 0.7, fontSize: "var(--font-size-base)" }}>
          View all modules with attached question packs and their questions
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ position: "relative" }}>
          <FiSearch
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-white)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 0.75rem 0.75rem 2.5rem",
              background: "var(--field)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-white)",
              fontSize: "var(--font-size-base)",
            }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--neon)", fontWeight: "var(--font-weight-header)" }}>
            {filteredModules.length}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Modules with Tests
          </div>
        </div>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--text-white)", fontWeight: "var(--font-weight-header)" }}>
            {filteredModules.reduce((sum, m) => sum + m.questionPacks.length, 0)}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Question Packs
          </div>
        </div>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--text-white)", fontWeight: "var(--font-weight-header)" }}>
            {filteredModules.reduce(
              (sum, m) => sum + m.questionPacks.reduce((s, p) => s + p.questions.length, 0),
              0
            )}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Questions
          </div>
        </div>
      </div>

      {/* Modules List */}
      {filteredModules.length === 0 ? (
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-white)",
            opacity: 0.6,
          }}
        >
          {searchTerm
            ? "No modules found matching your search"
            : "No modules with attached tests found"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredModules.map((moduleData) => {
            const isModuleExpanded = expandedModules.has(moduleData.module.id);

            return (
              <div
                key={moduleData.module.id}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Module Header */}
                <div
                  onClick={() => toggleModule(moduleData.module.id)}
                  style={{
                    padding: "1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--field)",
                    borderBottom: isModuleExpanded ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {isModuleExpanded ? (
                        <FiChevronDown size={20} color="var(--neon)" />
                      ) : (
                        <FiChevronRight size={20} color="var(--text-white)" />
                      )}
                      <h3
                        style={{
                          color: "var(--text-white)",
                          fontSize: "var(--font-size-header)",
                          fontWeight: "var(--font-weight-header)",
                          margin: 0,
                        }}
                      >
                        {moduleData.module.name}
                      </h3>
                    </div>
                    {moduleData.module.description && (
                      <p
                        style={{
                          color: "var(--text-white)",
                          opacity: 0.7,
                          fontSize: "var(--font-size-base)",
                          margin: "0.5rem 0 0 2rem",
                        }}
                      >
                        {moduleData.module.description}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      alignItems: "center",
                      marginLeft: "1rem",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "var(--neon)", fontSize: "1.25rem", fontWeight: "var(--font-weight-header)" }}>
                        {moduleData.questionPacks.length}
                      </div>
                      <div style={{ color: "var(--text-white)", opacity: 0.6, fontSize: "0.875rem" }}>
                        Packs
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ color: "var(--text-white)", fontSize: "1.25rem", fontWeight: "var(--font-weight-header)" }}>
                        {moduleData.questionPacks.reduce((sum, p) => sum + p.questions.length, 0)}
                      </div>
                      <div style={{ color: "var(--text-white)", opacity: 0.6, fontSize: "0.875rem" }}>
                        Questions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module Content */}
                {isModuleExpanded && (
                  <div style={{ padding: "1rem" }}>
                    {moduleData.questionPacks.map((packData) => {
                      const isPackExpanded = expandedPacks.has(packData.pack.id);

                      return (
                        <div
                          key={packData.pack.id}
                          style={{
                            background: "var(--field)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            marginBottom: "1rem",
                          }}
                        >
                          {/* Question Pack Header */}
                          <div
                            onClick={() => togglePack(packData.pack.id)}
                            style={{
                              padding: "1rem",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                              {isPackExpanded ? (
                                <FiChevronDown size={18} color="var(--neon)" />
                              ) : (
                                <FiChevronRight size={18} color="var(--text-white)" />
                              )}
                              <FiFileText size={18} color="var(--neon)" />
                              <h4
                                style={{
                                  color: "var(--text-white)",
                                  fontSize: "var(--font-size-base)",
                                  fontWeight: "var(--font-weight-header)",
                                  margin: 0,
                                }}
                              >
                                {packData.pack.title}
                              </h4>
                            </div>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                              <span
                                style={{
                                  color: "var(--text-white)",
                                  opacity: 0.7,
                                  fontSize: "0.875rem",
                                }}
                              >
                                Pass Mark: {packData.pack.pass_mark}%
                              </span>
                              <span
                                style={{
                                  color: "var(--neon)",
                                  fontSize: "0.875rem",
                                  fontWeight: "var(--font-weight-header)",
                                }}
                              >
                                {packData.questions.length} Questions
                              </span>
                            </div>
                          </div>

                          {/* Questions List */}
                          {isPackExpanded && (
                            <div
                              style={{
                                padding: "0 1rem 1rem 1rem",
                                borderTop: "1px solid var(--border)",
                              }}
                            >
                              {packData.questions.length === 0 ? (
                                <p
                                  style={{
                                    color: "var(--text-white)",
                                    opacity: 0.6,
                                    textAlign: "center",
                                    padding: "1rem",
                                  }}
                                >
                                  No questions in this pack
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                                  {packData.questions.map((questionData, index) => (
                                    <div
                                      key={questionData.question.id}
                                      style={{
                                        background: "var(--panel)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "8px",
                                        padding: "1rem",
                                      }}
                                    >
                                      {/* Question Header */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "flex-start",
                                          marginBottom: "0.75rem",
                                        }}
                                      >
                                        <div style={{ flex: 1 }}>
                                          <div
                                            style={{
                                              color: "var(--neon)",
                                              fontSize: "0.875rem",
                                              fontWeight: "var(--font-weight-header)",
                                              marginBottom: "0.25rem",
                                            }}
                                          >
                                            Question {index + 1}
                                          </div>
                                          <div
                                            style={{
                                              color: "var(--text-white)",
                                              fontSize: "var(--font-size-base)",
                                              fontWeight: "var(--font-weight-header)",
                                            }}
                                          >
                                            {questionData.question.question_text}
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: "0.75rem",
                                            alignItems: "center",
                                            marginLeft: "1rem",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--text-white)",
                                              opacity: 0.7,
                                              fontSize: "0.875rem",
                                            }}
                                          >
                                            {getQuestionTypeLabel(questionData.question.type)}
                                          </span>
                                          <span
                                            style={{
                                              background: "var(--neon)",
                                              color: "#000",
                                              padding: "0.25rem 0.5rem",
                                              borderRadius: "4px",
                                              fontSize: "0.875rem",
                                              fontWeight: "var(--font-weight-header)",
                                            }}
                                          >
                                            {questionData.question.points} pts
                                          </span>
                                        </div>
                                      </div>

                                      {/* Question Options */}
                                      {questionData.options.length > 0 && (
                                        <div style={{ marginTop: "0.75rem" }}>
                                          <div
                                            style={{
                                              color: "var(--text-white)",
                                              opacity: 0.7,
                                              fontSize: "0.875rem",
                                              marginBottom: "0.5rem",
                                            }}
                                          >
                                            Options:
                                          </div>
                                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                            {questionData.options.map((option) => (
                                              <div
                                                key={option.id}
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "0.5rem",
                                                  padding: "0.5rem",
                                                  background: option.is_correct
                                                    ? "rgba(34, 197, 94, 0.1)"
                                                    : "var(--field)",
                                                  border: option.is_correct
                                                    ? "1px solid var(--status-success)"
                                                    : "1px solid var(--border)",
                                                  borderRadius: "4px",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    width: "18px",
                                                    height: "18px",
                                                    borderRadius:
                                                      questionData.question.type === "mcq_single" ? "50%" : "4px",
                                                    border: option.is_correct
                                                      ? "2px solid var(--status-success)"
                                                      : "2px solid var(--border)",
                                                    background: option.is_correct
                                                      ? "var(--status-success)"
                                                      : "transparent",
                                                  }}
                                                />
                                                <span
                                                  style={{
                                                    color: "var(--text-white)",
                                                    fontSize: "0.875rem",
                                                  }}
                                                >
                                                  {option.option_text}
                                                  {option.is_correct && (
                                                    <span
                                                      style={{
                                                        color: "var(--status-success)",
                                                        marginLeft: "0.5rem",
                                                        fontWeight: "var(--font-weight-header)",
                                                      }}
                                                    >
                                                      (Correct)
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
