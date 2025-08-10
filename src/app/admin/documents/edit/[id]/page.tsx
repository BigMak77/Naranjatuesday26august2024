'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import HeroHeader from '@/components/HeroHeader'
import NeonForm from '@/components/NeonForm'
import { useUser } from '@/lib/useUser'

type Standard = { id: string; name: string }
type Section = { id: string; code: string; title: string; standard_id: string }

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser();

  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<any>(null)
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
    let newVersion = pendingVersion;
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
      <HeroHeader title="Edit Document" subtitle="Edit document details and upload a new file if needed." />
      {/* Version Confirmation Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 border-2 border-blue-400 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-blue-300 mb-2">Confirm Version Change</h2>
            <p className="text-white mb-2">You are about to update this document to version <span className="font-bold text-blue-400">{pendingVersion}</span>. Continue?</p>
            {versionErrorMsg && <p className="text-red-400 text-sm mb-2">{versionErrorMsg}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => { setShowVersionModal(false); setPendingVersion(null); setPendingEditData(null); }}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-bold"
                onClick={confirmVersionChange}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}
      <main className="min-h-screen text-teal-900 flex flex-col">
        <NeonForm title="Edit Document" onSubmit={handleEditSubmit}>
          <div>
            <label className="block text-sm font-medium text-white">Title *</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Reference Code</label>
            <input type="text" className="border rounded px-3 py-2 w-full" value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Document Type *</label>
            <select className="border rounded px-3 py-2 w-full" value={documentType} onChange={(e) => setDocumentType(e.target.value)} required>
              <option value="">Select type</option>
              <option value="policy">Policy</option>
              <option value="ssow">Safe System of Work (SSOW)</option>
              <option value="work_instruction">Work Instruction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Version Number</label>
            <input type="number" className="border rounded px-3 py-2 w-full" value={document?.current_version ?? ''} readOnly />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white">Standard *</label>
              <select className="border rounded px-3 py-2 w-full" value={standardId} onChange={(e) => { setStandardId(e.target.value); setSectionId('') }} required>
                <option value="">Select standard</option>
                {standards.map((std) => (<option key={std.id} value={std.id}>{std.name}</option>))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white">Section</label>
              <select className="border rounded px-3 py-2 w-full" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!standardId}>
                <option value="">Select section</option>
                {sections.filter((s) => s.standard_id === standardId).map((s) => (
                  <option key={s.id} value={s.id}>{s.code} – {s.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white">Upload New File (optional)</label>
            <input type="file" accept=".pdf" className="border rounded px-3 py-2 w-full" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          {file && (
            <div>
              <label className="block text-sm font-medium text-white">Version Notes</label>
              <textarea className="border rounded px-3 py-2 w-full" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
        </NeonForm>
      </main>
    </>
  )
}
