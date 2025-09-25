"use client";
import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonIconButton, { NeonSubmitApplicationButton } from "../ui/NeonIconButton";
import { FiX } from "react-icons/fi";
import SuccessModal from "@/components/ui/SuccessModal";

const TABLE_NAME = "vacancies"; // Updated to match your actual table name

// Remove the 'Apply' column from the columns array, it will be injected dynamically in the NeonTable below
const columns = [
  { header: "ID", accessor: "id" },
  { header: "Title", accessor: "title" },
  { header: "Department", accessor: "department" },
  { header: "Location", accessor: "location" },
  { header: "Commitment", accessor: "commitment" },
  { header: "Posted", accessor: "posted_at", render: (value: unknown) => {
      if (!value) return "";
      const date = new Date(value as string);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  },
];

const CareersPage: React.FC = () => {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Record<string, any> | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from(TABLE_NAME).select("*");
      if (error) {
        setError(error.message);
        setData([]);
      } else {
        setData(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleApply = (row: Record<string, any>) => {
    setSelectedRole(row);
    setModalOpen(true);
    setName("");
    setEmail("");
    setCv(null);
    setCoverLetter("");
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      // 1. Upload CV to Supabase Storage (optional, skip if not needed)
      let cvUrl = null;
      if (cv) {
        const fileExt = cv.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("applications-cv").upload(fileName, cv);
        if (uploadError) throw new Error("CV upload failed: " + uploadError.message);
        cvUrl = supabase.storage.from("applications-cv").getPublicUrl(fileName).data.publicUrl;
      }
      // 2. Insert application record into a new table (e.g. 'applications')
      const { error: insertError } = await supabase.from("applications").insert([
        {
          name,
          email,
          cover_letter: coverLetter,
          cv_url: cvUrl,
          vacancy_id: selectedRole?.id,
          vacancy_title: selectedRole?.title,
          submitted_at: new Date().toISOString(),
        },
      ]);
      if (insertError) throw new Error(insertError.message);
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <main>
      <img
        src="/CareerCropped.jpeg"
        alt="Careers at Naranja"
        style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 12, marginBottom: 24 }}
      />
      <h1>Careers</h1>
      <NeonTable
        columns={[
          ...columns,
          {
            header: "Apply",
            accessor: "apply",
            render: (_value: unknown, row: Record<string, any>) => (
              <button
                className="neon-btn"
                onClick={() => {
                  setSelectedRole(row);
                  setModalOpen(true);
                  setName("");
                  setEmail("");
                  setCv(null);
                  setCoverLetter("");
                  setSubmitSuccess(false);
                  setSubmitError(null);
                }}
                type="button"
              >
                Apply here
              </button>
            ),
            width: 120,
          },
        ]}
        data={data}
      />
      {modalOpen && (
        <OverlayDialog open={modalOpen} onClose={() => setModalOpen(false)} ariaLabelledby="apply-dialog-title">
          <div className="neon-form-title" id="apply-dialog-title" style={{ marginBottom: "1.25rem" }}>
            Apply for: {selectedRole?.title || "Role"}
          </div>
          {!submitSuccess && (
            <form className="neon-form" onSubmit={handleSubmit}>
              <label className="block mb-2">Full Name
                <input className="neon-input" type="text" value={name} onChange={e => setName(e.target.value)} required />
              </label>
              <label className="block mb-2">Email
                <input className="neon-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              <label className="block mb-2">CV (PDF)
                <input className="neon-input" type="file" accept=".pdf" onChange={e => setCv(e.target.files?.[0] || null)} required />
              </label>
              <label className="block mb-2">Cover Letter
                <textarea className="neon-input" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4} required />
              </label>
              {submitError && <div className="neon-error">{submitError}</div>}
              <div className="neon-form-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="neon-btn neon-btn-submit-application"
                  type="submit"
                  disabled={submitting}
                  title={submitting ? "Submitting…" : "Submit Application"}
                  aria-label="Submit Application"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </button>
                <NeonIconButton
                  variant="close"
                  icon={<FiX />}
                  title="Cancel"
                  aria-label="Cancel"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="neon-btn-close"
                />
              </div>
            </form>
          )}
          {submitSuccess && (
            <SuccessModal
              open={submitSuccess}
              onClose={() => { setSubmitSuccess(false); setModalOpen(false); }}
              message="Thank you for your application!"
            />
          )}
        </OverlayDialog>
      )}
    </main>
  );
};

export default CareersPage;
