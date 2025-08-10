'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import NeonForm from '@/components/NeonForm'

export default function AddDocumentPage() {
  const [title, setTitle] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [notes, setNotes] = useState('')
  const [standardId, setStandardId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [documentType, setDocumentType] = useState('policy')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [standards, setStandards] = useState<{ id: string; name: string }[]>([])
  const [sections, setSections] = useState<{ id: string; code: string; title: string }[]>([])
  const [showModuleAttach, setShowModuleAttach] = useState(false)
  const [showModuleSelector, setShowModuleSelector] = useState(false)
  const [modulesList, setModulesList] = useState<{ id: string; name: string }[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [addingNewModule, setAddingNewModule] = useState(false)
  const [newModuleName, setNewModuleName] = useState('')
  const [createdDocId, setCreatedDocId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchStandards = async () => {
      const { data, error } = await supabase.from('document_standard').select('id, name')
      if (!error) setStandards(data || [])
    }
    fetchStandards()
  }, [])

  useEffect(() => {
    if (!standardId) return
    const fetchSections = async () => {
      const { data, error } = await supabase
        .from('standard_sections')
        .select('id, code, title')
        .eq('standard_id', standardId)
        .order('code', { ascending: true })
      if (!error) setSections(data || [])
    }
    fetchSections()
  }, [standardId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !documentType) {
      alert('Title, file, and document type are required.')
      return
    }
    setUploading(true)

    if (referenceCode.trim()) {
      const { data: existing, error: checkError } = await supabase
        .from('documents')
        .select('id')
        .eq('reference_code', referenceCode.trim())
      if (checkError) {
        alert('Error checking reference code.')
        setUploading(false)
        return
      }
      if (existing && existing.length > 0) {
        alert('A document with this reference code already exists.')
        setUploading(false)
        return
      }
    }

    if (!file) {
      alert('File is required.')
      setUploading(false)
      return
    }
    // Extra file type check on submit for robustness
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed. Please select a PDF file.')
      setUploading(false)
      return
    }

    let publicUrl = ''
    let filePath = ''
    try {
      filePath = `${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file)
      if (uploadError) {
        alert('File upload failed.')
        setUploading(false)
        return
      }
      const urlResult = supabase.storage.from('documents').getPublicUrl(filePath)
      publicUrl = urlResult.data.publicUrl
      if (!publicUrl) {
        alert('Failed to get public URL for uploaded file.')
        setUploading(false)
        return
      }
    } catch (err) {
      alert('Unexpected error during file upload.')
      setUploading(false)
      return
    }

    let newDoc = null
    try {
      const { data, error: docError } = await supabase
        .from('documents')
        .insert({
          title,
          reference_code: referenceCode || null,
          file_url: publicUrl,
          document_type: documentType,
          section_id: sectionId,
          current_version: 1,
          review_period_months: 12,
          last_reviewed_at: new Date().toISOString(),
          created_by: null
        })
        .select()
        .single()
      if (docError || !data) {
        alert('Failed to create document.')
        setUploading(false)
        return
      }
      newDoc = data
    } catch (err) {
      alert('Unexpected error during document creation.')
      setUploading(false)
      return
    }

    try {
      const { error: versionError } = await supabase.from('document_versions').insert({
        document_id: newDoc.id,
        version_number: 1,
        file_url: publicUrl,
        notes: notes || null
      })
      if (versionError) {
        alert('Failed to save version 1.')
        setUploading(false)
        return
      }
    } catch (err) {
      alert('Unexpected error during version creation.')
      setUploading(false)
      return
    }

    if (newDoc?.id) setCreatedDocId(newDoc.id)
    setUploading(false)
    // Stage 2: Ask if user wants to attach to a training module
    const { data: modules } = await supabase.from('modules').select('id, name')
    setModulesList(modules || [])
    setShowModuleAttach(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(selected);
  };

  return (
    <>
      <main className="min-h-screen text-teal-900 flex flex-col">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2.5rem', marginLeft: '2.5rem', marginRight: '2.5rem' }}>
          <span className="text-lg font-semibold text-white" style={{ marginRight: '2rem' }}>Title: {title || '—'}</span>
          <span className="text-lg font-semibold text-white">Ref Code: {referenceCode || '—'}</span>
        </div>
        <div style={{ marginBottom: '2.5rem' }} />
        {!showModuleAttach ? (
          <NeonForm title="Add New Document" onSubmit={handleSubmit}>
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white">Title *</label>
              <input type="text" className="border rounded px-3 py-2 w-full" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            {/* Reference Code */}
            <div>
              <label className="block text-sm font-medium text-white">Reference Code</label>
              <input type="text" className="border rounded px-3 py-2 w-full" value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
            </div>
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-white">Document Type *</label>
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="border rounded px-3 py-2 w-full" required>
                <option value="">Select document type</option>
                <option value="policy">Policy</option>
                <option value="ssow">Safe System of Work (SSOW)</option>
                <option value="work_instruction">Work Instruction</option>
              </select>
            </div>
            {/* Standard and Section (inline) */}
            <div className="flex gap-4">
              {/* Standard */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-white">Standard *</label>
                <select value={standardId} onChange={(e) => { setStandardId(e.target.value); setSectionId('') }} className="border rounded px-3 py-2 w-full" required>
                  <option value="">Select standard</option>
                  {standards.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>
              {/* Section (inline with Standard) */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-white">Section</label>
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="border rounded px-3 py-2 w-full" disabled={!standardId}>
                  <option value="">Select section</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.code} – {sec.title}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-white">Upload File (PDF) *</label>
              <input type="file" accept=".pdf" className="border rounded px-3 py-2 w-full" onChange={handleFileChange} required />
            </div>
            {/* Version Notes */}
            <div>
              <label className="block text-sm font-medium text-white">Version Notes</label>
              <textarea className="border rounded px-3 py-2 w-full" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </NeonForm>
        ) : (
          <div style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }}>
            <h2 className="text-xl font-bold text-white mb-4">Would you like to attach this document to a training module?</h2>
            <div className="flex gap-4 mb-6">
              <button
                className="bg-teal-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-teal-700 transition"
                onClick={() => {
                  setShowModuleAttach(false)
                  setShowModuleSelector(false)
                }}
              >
                No, finish
              </button>
              <button
                className="bg-orange-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-orange-700 transition"
                onClick={() => setShowModuleSelector(true)}
              >
                Yes, attach
              </button>
            </div>
            {showModuleSelector && (
              !addingNewModule ? (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Existing Module</label>
                  <select
                    className="border rounded px-3 py-2 w-full mb-4"
                    value={selectedModuleId}
                    onChange={e => setSelectedModuleId(e.target.value)}
                  >
                    <option value="">Choose a module...</option>
                    {modulesList.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition"
                    onClick={() => setAddingNewModule(true)}
                  >
                    Add New Module
                  </button>
                  <button
                    className="bg-teal-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-teal-700 transition ml-4"
                    onClick={async () => {
                      if (!selectedModuleId) return alert('Select a module first.')
                      if (!createdDocId) return alert('Document not found.')
                      // Link document to module
                      await supabase.from('module_documents').insert({ module_id: selectedModuleId, document_id: createdDocId })
                      router.push('/admin/documents')
                    }}
                  >
                    Attach to Selected Module
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">New Module Name</label>
                  <input
                    type="text"
                    className="border rounded px-3 py-2 w-full mb-4"
                    value={newModuleName}
                    onChange={e => setNewModuleName(e.target.value)}
                  />
                  <button
                    className="bg-orange-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-orange-700 transition"
                    onClick={async () => {
                      if (!newModuleName.trim()) return alert('Enter a module name.')
                      if (!createdDocId) return alert('Document not found.')
                      // Create new module and link
                      const { data: module, error } = await supabase.from('modules').insert({ name: newModuleName }).select().single()
                      if (error || !module) return alert('Failed to create module.')
                      await supabase.from('module_documents').insert({ module_id: module.id, document_id: createdDocId })
                      router.push('/admin/documents')
                    }}
                  >
                    Create & Attach
                  </button>
                </div>
              )
            )}
          </div>
        )}
        <div style={{ marginTop: '2.5rem' }} />
      </main>
    </>
  )
}
