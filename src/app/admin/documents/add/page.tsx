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
    <div className="after-hero">
      <div className="page-content">
        <main className="add-document-main">
          <div className="add-document-header">
            <span className="add-document-title">Title: {title || '—'}</span>
            <span className="add-document-ref">Ref Code: {referenceCode || '—'}</span>
          </div>
          <div className="add-document-header-spacer" />
          {!showModuleAttach ? (
            <NeonForm title="Add New Document" onSubmit={handleSubmit}>
              {/* Title */}
              <div>
                <label className="add-document-label">Title *</label>
                <input type="text" className="add-document-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              {/* Reference Code */}
              <div>
                <label className="add-document-label">Reference Code</label>
                <input type="text" className="add-document-input" value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
              </div>
              {/* Document Type */}
              <div>
                <label className="add-document-label">Document Type *</label>
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="add-document-input" required>
                  <option value="">Select document type</option>
                  <option value="policy">Policy</option>
                  <option value="ssow">Safe System of Work (SSOW)</option>
                  <option value="work_instruction">Work Instruction</option>
                </select>
              </div>
              {/* Standard and Section (inline) */}
              <div className="add-document-standards-row">
                {/* Standard */}
                <div className="add-document-standards-col">
                  <label className="add-document-label">Standard *</label>
                  <select value={standardId} onChange={(e) => { setStandardId(e.target.value); setSectionId('') }} className="add-document-input" required>
                    <option value="">Select standard</option>
                    {standards.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>
                {/* Section (inline with Standard) */}
                <div className="add-document-standards-col">
                  <label className="add-document-label">Section</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="add-document-input" disabled={!standardId}>
                    <option value="">Select section</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.code} – {sec.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* File Upload */}
              <div>
                <label className="add-document-label">Upload File (PDF) *</label>
                <input type="file" accept=".pdf" className="add-document-input" onChange={handleFileChange} required />
              </div>
              {/* Version Notes */}
              <div>
                <label className="add-document-label">Version Notes</label>
                <textarea className="add-document-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </NeonForm>
          ) : (
            <div className="add-document-module-attach">
              <h2 className="add-document-module-title">Would you like to attach this document to a training module?</h2>
              <div className="add-document-module-btn-row">
                <button
                  className="add-document-module-btn add-document-module-btn-no"
                  onClick={() => {
                    setShowModuleAttach(false)
                    setShowModuleSelector(false)
                  }}
                >
                  No, finish
                </button>
                <button
                  className="add-document-module-btn add-document-module-btn-yes"
                  onClick={() => setShowModuleSelector(true)}
                >
                  Yes, attach
                </button>
              </div>
              {showModuleSelector && (
                !addingNewModule ? (
                  <div>
                    <label className="add-document-label add-document-module-label">Select Existing Module</label>
                    <select
                      className="add-document-input add-document-module-select"
                      value={selectedModuleId}
                      onChange={e => setSelectedModuleId(e.target.value)}
                    >
                      <option value="">Choose a module...</option>
                      {modulesList.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <button
                      className="add-document-module-btn add-document-module-btn-add"
                      onClick={() => setAddingNewModule(true)}
                    >
                      Add New Module
                    </button>
                    <button
                      className="add-document-module-btn add-document-module-btn-attach"
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
                    <label className="add-document-label add-document-module-label">New Module Name</label>
                    <input
                      type="text"
                      className="add-document-input add-document-module-input"
                      value={newModuleName}
                      onChange={e => setNewModuleName(e.target.value)}
                    />
                    <button
                      className="add-document-module-btn add-document-module-btn-create"
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
          <div className="add-document-footer-spacer" />
        </main>
      </div>
    </div>
  )
}
