// components/training/TrainingQuestionCategoriesTable.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import SuccessModal from "../ui/SuccessModal";
import TextIconButton from "@/components/ui/TextIconButtons";

interface Category {
  id: string;
  name: string;
  description?: string;
}

export default function TrainingQuestionCategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("question_categories")
      .select("id, name, description")
      .order("name", { ascending: true });
    console.log("Categories fetch result:", { data, error });
    if (error) setError(error.message);
    setCategories(data || []);
    setLoading(false);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    const { data, error } = await supabase
      .from("question_categories")
      .insert([{ name: addName.trim(), description: addDescription.trim() }]);
    setAddLoading(false);
    if (error) {
      setAddError(error.message);
    } else {
      setAddName("");
      setAddDescription("");
      setShowAdd(false);
      setShowSuccess(true);
      fetchCategories();
    }
  }

  return (
    <>
      <h3 className="text-lg font-semibold mb-2">Question Categories</h3>
      <div className="flex items-center gap-2 mb-3">
        <TextIconButton
          variant={showAdd ? "cancel" : "add"}
          label={showAdd ? "Cancel" : "Add Category"}
          title={showAdd ? "Cancel" : "Add Category"}
          onClick={() => setShowAdd((v) => !v)}
        />
      </div>
      {showAdd && (
        <form className="neon-form mb-4" onSubmit={handleAddCategory}>
          <div className="flex gap-2 mb-2">
            <input
              className="neon-input"
              placeholder="Category name"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              required
              disabled={addLoading}
            />
            <input
              className="neon-input"
              placeholder="Description (optional)"
              value={addDescription}
              onChange={e => setAddDescription(e.target.value)}
              disabled={addLoading}
            />
            <TextIconButton
              variant="add"
              label="Add"
              title="Add category"
              type="submit"
              disabled={addLoading || !addName.trim()}
            />
          </div>
          {addError && <div className="neon-error-message">{addError}</div>}
        </form>
      )}
      {error && <div className="neon-error-message mb-2">{error}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : categories.length === 0 ? (
        <div className="opacity-70 py-4 text-center">No categories found.</div>
      ) : (
        <table className="neon-table w-full">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.description || <span className="opacity-60">No description</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showSuccess && (
        <SuccessModal
          open={showSuccess}
          message="Category added!"
          onClose={() => setShowSuccess(false)}
        />
      )}
    </>
  );
}
