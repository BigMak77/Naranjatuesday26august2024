import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonTable from "@/components/NeonTable";

interface QuestionPack {
  id: string;
  title: string;
  description: string;
  version: number;
}

interface Question {
  id: string;
  question_text: string;
}

export default function QuestionPackList() {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [questionsByPack, setQuestionsByPack] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      // Fetch all packs
      const { data: packsData, error: packsErr } = await supabase
        .from("question_packs")
        .select("id, title, description, version")
        .order("title");
      if (packsErr) {
        setError(packsErr.message);
        setLoading(false);
        return;
      }
      setPacks(packsData || []);
      // Fetch all pack-question links
      const { data: links, error: linksErr } = await supabase
        .from("question_pack_questions")
        .select("pack_id, question_id");
      if (linksErr) {
        setError(linksErr.message);
        setLoading(false);
        return;
      }
      // Get all question IDs
      const allQids = Array.from(new Set((links || []).map(l => l.question_id)));
      let questions: Question[] = [];
      if (allQids.length > 0) {
        const { data: qs, error: qsErr } = await supabase
          .from("training_questions")
          .select("id, question_text")
          .in("id", allQids);
        if (qsErr) {
          setError(qsErr.message);
          setLoading(false);
          return;
        }
        questions = qs || [];
      }
      // Map questions to packs
      const qById: Record<string, Question> = {};
      questions.forEach(q => { qById[q.id] = q; });
      const byPack: Record<string, Question[]> = {};
      (links || []).forEach(l => {
        if (!byPack[l.pack_id]) byPack[l.pack_id] = [];
        if (qById[l.question_id]) byPack[l.pack_id].push(qById[l.question_id]);
      });
      setQuestionsByPack(byPack);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="neon-info">Loading question packs…</div>;
  if (error) return <div className="neon-error">{error}</div>;
  if (packs.length === 0) return <div className="neon-info">No question packs found.</div>;

  // Prepare table data
  const tableData = packs.map(pack => ({
    title: pack.title,
    version: pack.version,
    description: pack.description,
    questions: (questionsByPack[pack.id] || []).map(q => q.question_text).join(", ") || "—",
  }));

  return (
    <NeonTable
      columns={[
        { header: "Title", accessor: "title" },
        { header: "Version", accessor: "version" },
        { header: "Description", accessor: "description" },
        { header: "Questions", accessor: "questions" },
      ]}
      data={tableData}
    />
  );
}
