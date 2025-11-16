"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import NeonForm from "@/components/NeonForm";
import Modal from "@/components/modal";
import { STORAGE_BUCKETS } from "@/lib/storage-config";

type Std = { id: string; name: string };
type Sec = { id: string; code: string; title: string };
type Mod = { id: string; name: string };
type DocType = { id: string; name: string };

export default function AddDocumentPage() {
  const [title, setTitle] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [standardId, setStandardId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [standards, setStandards] = useState<Std[]>([]);
  const [sections, setSections] = useState<Sec[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocType[]>([]);

  const [showModuleAttach, setShowModuleAttach] = useState(false);
  const [showModuleSelector, setShowModuleSelector] = useState(false);
  const [modulesList, setModulesList] = useState<Mod[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [addingNewModule, setAddingNewModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  // Load Standards
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("document_standard")
        .select("id, name");
      if (!cancelled && !error) setStandards(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load Sections for selected standard
  useEffect(() => {
    if (!standardId) {
      setSections([]);
      setSectionId("");
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("standard_sections")
        .select("id, code, title")
        .eq("standard_id", standardId)
        .order("code", { ascending: true });
      if (!cancelled && !error) setSections(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [standardId]);

  // Fetch document types
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("document_types")
        .select("id, name");
      if (!cancelled && !error) setDocumentTypes(data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] || null;
      if (!selected) {
        setFile(null);
        return;
      }
      // Stricter PDF guard: type & extension
      const isPdfType = selected.type === "application/pdf";
      const isPdfExt = selected.name.toLowerCase().endsWith(".pdf");
      if (!isPdfType || !isPdfExt) {
        alert("Only PDF files are allowed.");
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(selected);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);

      try {
        // Required fields
        if (!file || !title || !documentTypeId) {
          alert("Title, file, and document type are required.");
          return;
        }

        // Upload file
        const safeName = file.name.replace(/\s+/g, "_");
        const filePath = `${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .upload(filePath, file, {
            upsert: true // Allow overwriting if file exists
          });
        if (uploadError) {
          console.error("Upload error:", uploadError);
          alert(`File upload failed: ${uploadError.message}`);
          return;
        }

        const urlResult = supabase.storage
          .from(STORAGE_BUCKETS.DOCUMENTS)
          .getPublicUrl(filePath);
        const publicUrl = urlResult.data.publicUrl;
        if (!publicUrl) {
          alert("Failed to get public URL for uploaded file.");
          return;
        }

        // Check if document with this reference_code already exists
        let existingDoc = null;
        const trimmedRefCode = referenceCode?.trim();
        if (trimmedRefCode) {
          console.log(`Checking for existing document with reference_code: "${trimmedRefCode}"`);
          const { data: existing, error: checkErr } = await supabase
            .from("documents")
            .select("id")
            .eq("reference_code", trimmedRefCode)
            .maybeSingle();

          if (checkErr) {
            console.error("Error checking for existing document:", checkErr);
          } else if (existing) {
            console.log(`Found existing document with ID: ${existing.id}`);
            existingDoc = existing;
          } else {
            console.log("No existing document found");
          }
        }

        let newDoc = null;
        let docError = null;

        if (existingDoc) {
          // Update existing document
          const updateResult = await supabase
            .from("documents")
            .update({
              title,
              file_url: publicUrl,
              document_type_id: documentTypeId,
              section_id: sectionId || null,
              review_period_months: 12,
              last_reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingDoc.id)
            .select()
            .single();
          newDoc = updateResult.data as { id: string } | null;
          docError = updateResult.error;
          if (!docError) {
            console.log(`Updated existing document with reference_code: ${referenceCode}`);
          }
        } else {
          // Insert new document
          console.log(`Inserting new document with reference_code: "${trimmedRefCode || '(null)'}"`);
          const insertResult = await supabase
            .from("documents")
            .insert({
              title,
              reference_code: trimmedRefCode || null,
              file_url: publicUrl,
              document_type_id: documentTypeId,
              section_id: sectionId || null,
              current_version: 1,
              review_period_months: 12,
              last_reviewed_at: new Date().toISOString(),
              created_by: null,
            })
            .select()
            .single();
          newDoc = insertResult.data as { id: string } | null;
          docError = insertResult.error;
          if (!docError) {
            console.log(`✓ Created new document with reference_code: ${trimmedRefCode || '(null)'}`);
          } else {
            console.error(`✗ Failed to insert document:`, docError);
          }
        }

        if (docError || !newDoc) {
          console.error("Document save error:", docError);

          // Check if it's a unique constraint violation
          if (docError?.code === '23505' || docError?.message.includes('duplicate') || docError?.message.includes('unique')) {
            // Try to find the existing document with this reference code
            // Note: reference_code is globally unique, not per-section
            const { data: existingDoc } = await supabase
              .from('documents')
              .select('id, title, reference_code')
              .eq('reference_code', trimmedRefCode)
              .maybeSingle();

            if (existingDoc) {
              alert(
                `Reference code "${trimmedRefCode}" is already used by "${existingDoc.title}". ` +
                `Please use a different reference code.`
              );
            } else {
              alert(
                `Reference code "${trimmedRefCode}" is already in use. ` +
                `Please use a different reference code.`
              );
            }
          } else {
            alert(`Failed to save document: ${docError?.message || 'Unknown error'}`);
          }
          return;
        }

        // Create version 1
        const { error: versionError } = await supabase
          .from("document_versions")
          .insert({
            document_id: newDoc.id,
            version_number: 1,
            file_url: publicUrl,
            notes: notes || null,
          });
        if (versionError) {
          alert("Failed to save version 1.");
          return;
        }

        setCreatedDocId(newDoc.id);

        // Stage 2: attach to a training module?
        const { data: modules } = await supabase
          .from("modules")
          .select("id, name");
        setModulesList(modules || []);
        setShowModuleAttach(true);
      } catch {
        alert("Unexpected error while saving the document.");
      } finally {
        setSubmitting(false);
      }
    },
    [documentTypeId, file, notes, referenceCode, sectionId, submitting, title],
  );

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="add-document-main">
          <div className="add-document-header">
            <span className="add-document-title">Title: {title || "—"}</span>
            <span className="add-document-ref">
              Ref Code: {referenceCode || "—"}
            </span>
          </div>

          <div className="add-document-header-spacer" />

          {!showModuleAttach ? (
            <NeonForm
              title="Add New Document"
              onSubmit={handleSubmit}
              submitLabel={submitting ? "Saving…" : "Save Document"}
            >
              {/* Title */}
              <div className="neon-form-row">
                <label htmlFor="doc-title" className="neon-label">
                  Title *
                </label>
                <input
                  id="doc-title"
                  type="text"
                  className="neon-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              {/* Reference Code */}
              <div className="neon-form-row">
                <label htmlFor="doc-ref" className="neon-label">
                  Reference Code
                </label>
                <input
                  id="doc-ref"
                  type="text"
                  className="neon-input"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                />
              </div>
              {/* Document Type */}
              <div className="neon-form-row">
                <label htmlFor="doc-type" className="neon-label">
                  Document Type *
                </label>
                <select
                  id="doc-type"
                  value={documentTypeId}
                  onChange={(e) => setDocumentTypeId(e.target.value)}
                  className="neon-input"
                  required
                >
                  <option value="">Select document type</option>
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name}</option>
                  ))}
                </select>
              </div>
              {/* Standard + Section */}
              <div className="neon-form-row">
                <div className="neon-form-col">
                  <label htmlFor="doc-standard" className="neon-label">
                    Standard *
                  </label>
                  <select
                    id="doc-standard"
                    value={standardId}
                    onChange={(e) => {
                      setStandardId(e.target.value);
                      setSectionId("");
                    }}
                    className="neon-input"
                    required
                  >
                    <option value="">Select standard</option>
                    {standards.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="neon-form-col">
                  <label htmlFor="doc-section" className="neon-label">
                    Section
                  </label>
                  <select
                    id="doc-section"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="neon-input"
                    disabled={!standardId}
                  >
                    <option value="">Select section</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.code} – {sec.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* File Upload */}
              <div className="neon-form-row">
                <label htmlFor="doc-file" className="neon-label">
                  Upload File (PDF) *
                </label>
                <input
                  id="doc-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className="neon-input"
                  onChange={handleFileChange}
                  required
                />
              </div>
              {/* Version Notes */}
              <div className="neon-form-row">
                <label htmlFor="doc-notes" className="neon-label">
                  Version Notes
                </label>
                <textarea
                  id="doc-notes"
                  className="neon-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </NeonForm>
          ) : (
            <Modal
              open={showModuleAttach}
              onClose={() => {
                setShowModuleAttach(false);
                setShowModuleSelector(false);
                router.push("/admin/documents");
              }}
            >
              <NeonForm
                title="Attach Document to Training Module"
                onSubmit={(e) => e.preventDefault()}
                submitLabel="Finish"
              >
                <h2 className="neon-form-title">
                  Would you like to attach this document to a training module?
                </h2>
                <div className="flex gap-3 mt-4">
                  <button
                    className="neon-btn neon-btn-danger"
                    type="button"
                    onClick={() => {
                      setShowModuleAttach(false);
                      setShowModuleSelector(false);
                      router.push("/admin/documents");
                    }}
                  >
                    No, finish
                  </button>
                  <button
                    className="neon-btn neon-btn-accent"
                    type="button"
                    onClick={() => setShowModuleSelector(true)}
                  >
                    Yes, attach
                  </button>
                </div>
                {showModuleSelector &&
                  (!addingNewModule ? (
                    <div className="mt-6">
                      <label className="neon-label">
                        Select Existing Module
                      </label>
                      <select
                        className="neon-input"
                        value={selectedModuleId}
                        onChange={(e) => setSelectedModuleId(e.target.value)}
                      >
                        <option value="">Choose a module...</option>
                        {modulesList.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-3 mt-4">
                        <button
                          className="neon-btn neon-btn-add"
                          type="button"
                          onClick={() => setAddingNewModule(true)}
                        >
                          Add New Module
                        </button>
                        <button
                          className="neon-btn neon-btn-save"
                          type="button"
                          onClick={async () => {
                            if (!selectedModuleId)
                              return alert("Select a module first.");
                            if (!createdDocId)
                              return alert("Document not found.");
                            await supabase
                              .from("module_documents")
                              .insert({
                                module_id: selectedModuleId,
                                document_id: createdDocId,
                              });
                            router.push("/admin/documents");
                          }}
                        >
                          Attach to Selected Module
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6">
                      <label className="neon-label">New Module Name</label>
                      <input
                        type="text"
                        className="neon-input"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                      />
                      <div className="flex gap-3 mt-4">
                        <button
                          className="neon-btn neon-btn-save"
                          type="button"
                          onClick={async () => {
                            if (!newModuleName.trim())
                              return alert("Enter a module name.");
                            if (!createdDocId)
                              return alert("Document not found.");
                            const moduleResult = await supabase
                              .from("modules")
                              .insert({ name: newModuleName })
                              .select()
                              .single();
                            const module = moduleResult.data as Mod;
                            const error = moduleResult.error;
                            if (error || !module) {
                              alert("Failed to create module.");
                              return;
                            }
                            await supabase
                              .from("module_documents")
                              .insert({
                                module_id: module.id,
                                document_id: createdDocId,
                              });
                            router.push("/admin/documents");
                          }}
                        >
                          Create & Attach
                        </button>
                      </div>
                    </div>
                  ))}
              </NeonForm>
            </Modal>
          )}

          <div className="add-document-footer-spacer" />
        </main>
      </div>
    </div>
  );
}
