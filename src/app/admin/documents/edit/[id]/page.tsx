'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonForm from '@/components/NeonForm'
import { useUser } from '@/lib/useUser'

type Standard = { id: string; name: string }
type Section = { id: string; code: string; title: string; standard_id: string }

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser();

  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<unknown>(null)
  const [title, setTitle] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [standardId, setStandardId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [standards, setStandards] = useState<Standard[]>([])
  const [sections, setSections] = useState<Section[]>([])

  // Add state for version confirmation modal
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [pendingVersion, setPendingVersion] = useState<number | null>(null)
  const [pendingEditData, setPendingEditData] = useState<any>(null)
  const [versionErrorMsg, setVersionErrorMsg] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const { data: doc, error } = await supabase.from('documents').select('*').eq('id', id).single()
      if (error) {
        console.error('Error fetching document:', error)
        return
      }

      setDocument(doc)
      setTitle(doc.title)
      setReferenceCode(doc.reference_code || '')
      setDocumentType(doc.document_type || '')

      const { data: stds } = await supabase.from('document_standard').select('id, name')
      setStandards(stds || [])

      const { data: sectionData, error: secErr } = await supabase
        .from('standard_sections')
        .select('id, code, title, standard_id')

      if (secErr) console.error(secErr)
      else {
        setSections(sectionData || [])
        const currentSection = sectionData?.find((s) => s.id === doc.section_id)
        if (currentSection) {
          setSectionId(currentSection.id)
          setStandardId(currentSection.standard_id)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  // Function to handle edit submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !documentType) {
      alert('Title and type are required.');
      return;
    }
    // Prepare edit data
    const editData = {
      id: document.id,
      title,
      reference_code: referenceCode || null,
      document_type: documentType,
      section_id: sectionId,
      file_url: document.file_url,
      notes,
      standard_id: standardId,
      // current_version will be set in confirmVersionChange
    };
    // Use latest current_version from state
    const currentVersion = document?.current_version ?? 0;
    const nextVersion = currentVersion + 1;
    setPendingVersion(nextVersion);
    setPendingEditData({ ...editData, current_version: currentVersion });
    setShowVersionModal(true);
    setVersionErrorMsg('');
  };

  const confirmVersionChange = async () => {
    if (!pendingEditData) return;
    let fileUrl = pendingEditData.file_url;
    const newVersion = pendingVersion;
    // Handle file upload if needed
    if (file) {
      if (!user?.auth_id) {
        alert('Cannot archive: user not loaded. Please refresh and try again.');
        return;
      }
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      if (uploadError) {
        alert('File upload failed.');
        console.error('Upload error:', uploadError);
        return;
      }
      fileUrl = supabase.storage.from('documents').getPublicUrl(filePath).data.publicUrl;
      // Archive current version
      const { error: archiveError } = await supabase.from('document_archive').insert({
        document_id: document.id,
        archived_version: document.current_version,
        title: document.title,
        reference_code: document.reference_code,
        file_url: document.file_url,
        document_type: document.document_type,
        notes: notes || null,
        change_summary: 'Manual update via edit form',
        change_date: new Date().toISOString(),
        archived_by_auth_id: user.auth_id,
      });
      if (archiveError) {
        alert('Failed to archive current document.');
        console.error('Archive insert error:', archiveError);
        return;
      }
    }
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ...pendingEditData,
        file_url: fileUrl,
        current_version: newVersion,
        last_updated_at: now,
        last_reviewed_at: now,
      })
      .eq('id', document.id);
    if (updateError) {
      setVersionErrorMsg('Failed to update document: ' + updateError.message);
      return;
    }
    setShowVersionModal(false);
    setPendingVersion(null);
    setPendingEditData(null);
    alert('Document updated to version ' + newVersion);
    router.push('/admin/documents');
  };

  if (loading) return <p className="text-gray-600 m-0 p-0">Loading...</p>

  return (
    <>
      {/* Version Confirmation Modal */}
      {showVersionModal && (
        <div className="modal-version-overlay">
          <div className="modal-version-container">
            <h2 className="modal-version-title">Confirm Version Change</h2>
            <p className="modal-version-message">You are about to update this document to version <span className="modal-version-number">{pendingVersion}</span>. Continue?</p>
            {versionErrorMsg && <p className="modal-version-error">{versionErrorMsg}</p>}
            <div className="modal-version-actions">
              <button
                className="modal-version-cancel"
                onClick={() => { setShowVersionModal(false); setPendingVersion(null); setPendingEditData(null); }}
              >Cancel</button>
              <button
                className="modal-version-confirm"
                onClick={confirmVersionChange}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
      <main className="edit-document-main">
        <NeonForm title="Edit Document" onSubmit={handleEditSubmit}>
          <div>
            <label className="edit-document-label">Title *</label>
            <input type="text" className="edit-document-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="edit-document-label">Reference Code</label>
            <input type="text" className="edit-document-input" value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
          </div>
          <div>
            <label className="edit-document-label">Document Type *</label>
            <select className="edit-document-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)} required>
              <option value="">Select type</option>
              <option value="policy">Policy</option>
              <option value="ssow">Safe System of Work (SSOW)</option>
              <option value="work_instruction">Work Instruction</option>
            </select>
          </div>
          <div>
            <label className="edit-document-label">Version Number</label>
            <input type="number" className="edit-document-input" value={document?.current_version ?? ''} readOnly />
          </div>
          <div className="edit-document-row">
            <div className="edit-document-col">
              <label className="edit-document-label">Standard *</label>
              <select className="edit-document-input" value={standardId} onChange={(e) => { setStandardId(e.target.value); setSectionId('') }} required>
                <option value="">Select standard</option>
                {standards.map((std) => (<option key={std.id} value={std.id}>{std.name}</option>))}
              </select>
            </div>
            <div className="edit-document-col">
              <label className="edit-document-label">Section</label>
              <select className="edit-document-input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!standardId}>
                <option value="">Select section</option>
                {sections.filter((s) => s.standard_id === standardId).map((s) => (
                  <option key={s.id} value={s.id}>{s.code} – {s.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="edit-document-label">Upload New File (optional)</label>
            <input type="file" accept=".pdf" className="edit-document-input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {file && (
            <div>
              <label className="edit-document-label">Version Notes</label>
              <textarea className="edit-document-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
        </NeonForm>
      </main>
    </>
  )
}
