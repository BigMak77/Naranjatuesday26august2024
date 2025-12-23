"use client";
import React, { useEffect, useState } from "react";
import NeonTable from "@/components/NeonTable";
import { supabase } from "@/lib/supabase-client";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TextIconButton from "@/components/ui/TextIconButtons";
import SuccessModal from "@/components/ui/SuccessModal";
import FileInput from "@/components/ui/FileInput";
import ContentHeader from "@/components/ui/ContentHeader";
import { STORAGE_BUCKETS } from "@/lib/storage-config";

const TABLE_NAME = "vacancies"; // Updated to match your actual table name

// Remove the 'Apply' column from the columns array, it will be injected dynamically in the NeonTable below
const columns = [
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

export default function Careers() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Record<string, any> | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      // 1. Upload CV to Supabase Storage
      let cvUrl = null;
      if (cv) {
        const fileExt = cv.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.APPLICATIONS).upload(fileName, cv);
        if (uploadError) throw new Error("CV upload failed: " + uploadError.message);
        cvUrl = supabase.storage.from(STORAGE_BUCKETS.APPLICATIONS).getPublicUrl(fileName).data.publicUrl;
      }
      // 2. Upload covering letter file to Supabase Storage
      let coverLetterUrl = null;
      if (coverLetterFile) {
        const fileExt = coverLetterFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}_cover.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.APPLICATIONS).upload(fileName, coverLetterFile);
        if (uploadError) throw new Error("Cover letter upload failed: " + uploadError.message);
        coverLetterUrl = supabase.storage.from(STORAGE_BUCKETS.APPLICATIONS).getPublicUrl(fileName).data.publicUrl;
      }
      // 3. Insert application record into a new table (e.g. 'applications')
      const { error: insertError } = await supabase.from("applications").insert([
        {
          name,
          email,
          cover_letter: coverLetter,
          cover_letter_url: coverLetterUrl,
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
      <ContentHeader
        title="Careers"
        description="Join our team and discover exciting career opportunities at Naranja."
      />
      <NeonTable
        columns={[
          ...columns,
          {
            header: "Apply",
            accessor: "apply",
            render: (_value: unknown, row: Record<string, any>) => (
              <TextIconButton
                variant="send"
                label="Apply here"
                onClick={() => {
                  setSelectedRole(row);
                  setModalOpen(true);
                  setName("");
                  setEmail("");
                  setCv(null);
                  setCoverLetterFile(null);
                  setCoverLetter("");
                  setSubmitSuccess(false);
                  setSubmitError(null);
                }}
              />
            ),
            width: 120,
          },
        ]}
        data={data}
      />
      {modalOpen && (
        <OverlayDialog showCloseButton={true} open={modalOpen} onClose={() => setModalOpen(false)} ariaLabelledby="apply-dialog-title">
          <div className="neon-form-title" id="apply-dialog-title" style={{ marginBottom: "1.25rem" }}>
            Apply for: {selectedRole?.title || "Role"}
          </div>
          {!submitSuccess && (
            <form className="neon-form" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <label className="block">Full Name
                  <input className="neon-input" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </label>
                <label className="block">Email
                  <input className="neon-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </label>
              </div>
              <FileInput
                label="CV (PDF)"
                accept=".pdf"
                required
                value={cv}
                onChange={setCv}
                className="mb-2"
              />
              <FileInput
                label="Attach Covering Letter (PDF - Optional)"
                accept=".pdf"
                required={false}
                value={coverLetterFile}
                onChange={setCoverLetterFile}
                className="mb-2"
              />
              <label className="block mb-2">Application Supporting Notes
                <textarea className="neon-input" value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={10} required />
              </label>
              {submitError && <div className="neon-error">{submitError}</div>}
              <div className="neon-form-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TextIconButton
                  variant="submitApplication"
                  label={submitting ? "Submitting…" : "Submit Application"}
                  type="submit"
                  disabled={submitting}
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
}
