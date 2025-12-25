"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import { useUser } from "@/lib/useUser";
import Modal from "@/components/modal";
import SuccessModal from "@/components/ui/SuccessModal";
import { STORAGE_BUCKETS } from "@/lib/storage-config";
import { useDocumentMetadata } from "@/lib/hooks/useDocumentMetadata";
import type { Document } from "@/types/document";

interface DocumentEditFormProps {
  documentId: string;
  onSuccess?: () => void;
}

export default function DocumentEditForm({ documentId, onSuccess }: DocumentEditFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { standards, sections, documentTypes, loading: metadataLoading } = useDocumentMetadata();

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Version confirmation modal state
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [pendingVersion, setPendingVersion] = useState<number | null>(null);
  const [pendingEditData, setPendingEditData] = useState<Document | null>(null);
  const [versionErrorMsg, setVersionErrorMsg] = useState("");

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Handler for success modal close
  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/admin/documents");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: doc, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", documentId)
        .single();

      if (error) {
        console.error("Error fetching document:", error);
        setLoading(false);
        return;
      }

      setDocument(doc);
      setTitle(doc.title);
      setReferenceCode(doc.reference_code || "");
      setDocumentTypeId(doc.document_type_id || "");

      const currentSection = sections.find((s) => s.id === doc.section_id);
      if (currentSection) {
        setSectionId(currentSection.id);
        setStandardId(currentSection.standard_id || "");
      }

      setLoading(false);
    };

    if (!metadataLoading) {
      fetchData();
    }
  }, [documentId, metadataLoading, sections]);

  // Function to handle edit submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !documentTypeId) {
      alert("Title and type are required.");
      return;
    }
    // Prepare edit data
    const editData: Document = {
      id: document?.id || "",
      title,
      reference_code: referenceCode || "",
      document_type_id: documentTypeId,
      section_id: sectionId || "",
      file_url: document?.file_url || "",
      notes,
      standard_id: standardId || "",
    };
    // Use latest current_version from state
    const currentVersion = document?.current_version ?? 0;
    const nextVersion = currentVersion + 1;
    setPendingVersion(nextVersion);
    setPendingEditData({ ...editData, current_version: currentVersion });
    setShowVersionModal(true);
    setVersionErrorMsg("");
  };

  const confirmVersionChange = async () => {
    if (!pendingEditData) {
      console.error("No pendingEditData");
      setVersionErrorMsg("No pending data found. Please try again.");
      return;
    }

    let fileUrl = pendingEditData.file_url;
    const newVersion = pendingVersion;

    // Handle file upload if needed
    if (file) {
      if (!user?.auth_id) {
        setVersionErrorMsg("Cannot archive: user not loaded. Please refresh and try again.");
        return;
      }

      const filePath = `${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setVersionErrorMsg(`File upload failed: ${uploadError.message}`);
        return;
      }

      fileUrl = supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).getPublicUrl(filePath)
        .data.publicUrl;

      // Archive current version
      const { error: archiveError } = await supabase
        .from("document_archive")
        .insert({
          document_id: document?.id,
          archived_version: document?.current_version,
          title: document?.title,
          reference_code: document?.reference_code,
          file_url: document?.file_url,
          document_type_id: document?.document_type_id,
          notes: notes || null,
          change_summary: "Manual update via edit form",
          change_date: new Date().toISOString(),
          archived_by_auth_id: user.auth_id,
        });

      if (archiveError) {
        console.error("Archive insert error:", archiveError);
        setVersionErrorMsg("Failed to archive current document.");
        return;
      }
    }
    const now = new Date().toISOString();

    const updateData = {
      title: pendingEditData.title,
      reference_code: pendingEditData.reference_code || null,
      document_type_id: pendingEditData.document_type_id,
      section_id: pendingEditData.section_id || null,
      file_url: fileUrl,
      notes: pendingEditData.notes || null,
      current_version: newVersion,
      last_updated_at: now,
      last_reviewed_at: now,
    };

    const { data: updateResult, error: updateError } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", document?.id)
      .select();

    if (updateError) {
      console.error("Update error:", updateError);

      // Check if it's a unique constraint violation
      if (updateError.code === '23505' || updateError.message.includes('duplicate') || updateError.message.includes('unique')) {
        const { data: existingDoc } = await supabase
          .from('documents')
          .select('id, title, reference_code, section_id')
          .eq('reference_code', updateData.reference_code)
          .neq('id', document?.id)
          .maybeSingle();

        if (existingDoc) {
          setVersionErrorMsg(`Reference code "${updateData.reference_code}" is already used by "${existingDoc.title}". Please use a different reference code.`);
        } else {
          setVersionErrorMsg(`Reference code "${updateData.reference_code}" is already in use. Please use a different reference code.`);
        }
      } else {
        setVersionErrorMsg(`Failed to update document: ${updateError.message} (Error Code: ${updateError.code})`);
      }
      return;
    }

    setShowVersionModal(false);
    setPendingVersion(null);
    setPendingEditData(null);
    setSuccessMessage(`Document updated to version ${newVersion}`);
    setShowSuccessModal(true);
  };

  if (loading) return <p className="text-gray-600 m-0 p-0">Loading...</p>;

  return (
    <>
      {/* Version Confirmation Modal */}
      <Modal
        open={showVersionModal}
        onClose={() => {
          setShowVersionModal(false);
          setPendingVersion(null);
          setPendingEditData(null);
        }}
      >
        <NeonForm
          title="Confirm Version Change"
          onSubmit={(e) => {
            e.preventDefault();
            confirmVersionChange();
          }}
          submitLabel="Confirm"
          onCancel={() => {
            setShowVersionModal(false);
            setPendingVersion(null);
            setPendingEditData(null);
            setVersionErrorMsg("");
          }}
        >
          {!versionErrorMsg ? (
            <p className="neon-form-message">
              You are about to update this document to version{" "}
              <span className="neon-form-number">{pendingVersion}</span>.
              Continue?
            </p>
          ) : (
            <div
              style={{
                backgroundColor: "#ff444420",
                border: "2px solid #ff4444",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p
                style={{
                  color: "#ff4444",
                  fontWeight: "bold",
                  margin: "0 0 0.5rem 0",
                  fontSize: "1.1rem",
                }}
              >
                ⚠️ Error
              </p>
              <p
                style={{
                  color: "#fff",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {versionErrorMsg}
              </p>
            </div>
          )}
        </NeonForm>
      </Modal>

      <main className="edit-document-main">
        <NeonForm
          title="Edit Document"
          onSubmit={handleEditSubmit}
          submitLabel="Save Changes"
        >
          <div>
            <label className="neon-label">Title *</label>
            <input
              type="text"
              className="neon-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="neon-label">Reference Code</label>
            <input
              type="text"
              className="neon-input"
              value={referenceCode}
              onChange={(e) => setReferenceCode(e.target.value)}
            />
          </div>
          <div>
            <label className="neon-label">Document Type *</label>
            <select
              className="neon-input"
              value={documentTypeId}
              onChange={(e) => setDocumentTypeId(e.target.value)}
              required
            >
              <option value="">Select type</option>
              {documentTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>{dt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="neon-label">Version Number</label>
            <input
              type="number"
              className="neon-input"
              value={document?.current_version ?? ""}
              readOnly
            />
          </div>
          <div className="neon-form-row">
            <div className="neon-form-col">
              <label className="neon-label">Standard *</label>
              <select
                className="neon-input"
                value={standardId}
                onChange={(e) => {
                  setStandardId(e.target.value);
                  setSectionId("");
                }}
                required
              >
                <option value="">Select standard</option>
                {standards.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="neon-form-col">
              <label className="neon-label">Section</label>
              <select
                className="neon-input"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!standardId}
              >
                <option value="">Select section</option>
                {sections
                  .filter((s) => s.standard_id === standardId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} – {s.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label className="neon-label">Upload New File (optional)</label>
            <input
              type="file"
              accept=".pdf"
              className="neon-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {file && (
            <div>
              <label className="neon-label">Version Notes</label>
              <textarea
                className="neon-input"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </NeonForm>
      </main>

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={handleSuccessClose}
        title="Success"
        message={successMessage}
      />
    </>
  );
}
