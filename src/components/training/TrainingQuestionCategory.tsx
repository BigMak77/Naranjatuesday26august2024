"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TrainingCategory {
  id: string;
  name: string;
}

interface TrainingQuestion {
  id: string;
  text: string;
  category_id: string;
}

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  margin: "24px 0",
  fontSize: 18,
};
const thtd: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px 16px",
  textAlign: "left",
};

const TrainingQuestionCategory: React.FC = () => {
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<null | boolean>(null); // null=not answered, true=add, false=select
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      let catData = null, catError = null, qData = null, qError = null;
      try {
        const catRes = await supabase.from("question_categories").select("id, name");
        catData = catRes.data;
        catError = catRes.error;
      } catch (e) {
        catError = e instanceof Error ? e : { message: String(e) };
      }
      try {
        // Use the correct table name for questions: training_questions
        const qRes = await supabase.from("training_questions").select("id, text, category_id");
        qData = qRes.data;
        qError = qRes.error;
        if (qError && qError.code === '400') {
          qData = [];
          qError = null;
        }
      } catch (e) {
        if (typeof e === 'object' && e !== null && 'code' in e) {
          // @ts-ignore
          if (e.code === '400') {
            qData = [];
            qError = null;
          } else {
            qError = e;
          }
        } else {
          qError = e instanceof Error ? e : { message: String(e) };
        }
      }
      const getMsg = (err: any) => (err && (err.message || err.toString())) || "";
      if (catError || qError) {
        setError(getMsg(catError) || getMsg(qError) || "Unknown error");
        setCategories([]);
        setQuestions([]);
      } else {
        setCategories(catData || []);
        setQuestions(qData || []);
      }
      setLoading(false);
    })();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddBusy(true);
    setAddError(null);
    const { data, error } = await supabase
      .from("question_categories")
      .insert([{ name: newCategoryName.trim() }])
      .select();
    if (error) {
      setAddError(error.message);
    } else {
      setCategories((prev) => [...prev, ...(data || [])]);
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      setSelectedCategoryId(data?.[0]?.id || "");
    }
    setAddBusy(false);
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;

  // Step 1: Ask if user needs to create a new category
  if (showNewCategoryInput === null) {
    return (
      <div style={{ margin: 24 }}>
        <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 16 }}>
          Do you need to create a new category?
        </div>
        <button
          className="neon-btn neon-btn-primary"
          style={{ marginRight: 12 }}
          onClick={() => setShowNewCategoryInput(true)}
        >
          Yes
        </button>
        <button
          className="neon-btn neon-btn-secondary"
          onClick={() => setShowNewCategoryInput(false)}
        >
          No
        </button>
      </div>
    );
  }

  // Step 2a: Show new category input
  if (showNewCategoryInput) {
    return (
      <div style={{ margin: 24 }}>
        <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 12 }}>
          Enter a name for the new category:
        </div>
        <input
          className="neon-input"
          type="text"
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          disabled={addBusy}
          style={{ marginBottom: 8, minWidth: 240 }}
        />
        <button
          className="neon-btn neon-btn-primary"
          onClick={handleAddCategory}
          disabled={addBusy || !newCategoryName.trim()}
          style={{ marginLeft: 8 }}
        >
          Add
        </button>
        <button
          className="neon-btn neon-btn-secondary"
          onClick={() => setShowNewCategoryInput(null)}
          disabled={addBusy}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </button>
        {addError && <div style={{ color: "red", marginTop: 8 }}>{addError}</div>}
      </div>
    );
  }

  // Step 2b: Select category
  return (
    <div style={{ margin: 24 }}>
      <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 12 }}>
        Please select the category that questions will be connected to:
      </div>
      <select
        className="neon-input"
        value={selectedCategoryId}
        onChange={e => setSelectedCategoryId(e.target.value)}
        style={{ minWidth: 240, marginBottom: 16 }}
      >
        <option value="">-- Select a category --</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      {selectedCategoryId && (
        <div style={{ marginTop: 16 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thtd}>Category</th>
                <th style={thtd}>Questions</th>
              </tr>
            </thead>
            <tbody>
              {categories.filter(cat => cat.id === selectedCategoryId).map(cat => (
                <tr key={cat.id}>
                  <td style={thtd}>{cat.name}</td>
                  <td style={thtd}>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {questions.filter(q => q.category_id === cat.id).length === 0 ? (
                        <li style={{ opacity: 0.6 }}>(No questions)</li>
                      ) : (
                        questions.filter(q => q.category_id === cat.id).map(q => (
                          <li key={q.id}>{q.text}</li>
                        ))
                      )}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrainingQuestionCategory;
