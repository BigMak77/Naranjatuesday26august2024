'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'react-hot-toast'

export default function DepartmentProfilePage() {
  const { id } = useParams()
  const departmentId = id as string

  const [departmentName, setDepartmentName] = useState('')
  const [modules, setModules] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [docTypeFilter, setDocTypeFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Department name
      const { data: deptData } = await supabase
        .from('departments')
        .select('name')
        .eq('id', departmentId)
        .single()
      setDepartmentName(deptData?.name || '')

      // Modules
      const { data: allModules } = await supabase.from('modules').select('id, title')
      const { data: assignedModules } = await supabase
        .from('department_modules')
        .select('module_id')
        .eq('department_id', departmentId)
      setModules(allModules || [])
      setSelectedModuleIds((assignedModules || []).map((m) => m.module_id))

      // Documents
      const { data: allDocuments } = await supabase
        .from('documents')
        .select('id, title, document_type')
      const { data: assignedDocs } = await supabase
        .from('department_documents')
        .select('document_id')
        .eq('department_id', departmentId)
      setDocuments(allDocuments || [])
      setSelectedDocumentIds((assignedDocs || []).map((d) => d.document_id))

      setLoading(false)
    }

    if (departmentId) fetchData()
  }, [departmentId])

  const handleModuleToggle = (id: string) => {
    setSelectedModuleIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleDocumentToggle = (id: string) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setLoading(true)

    // Modules
    await supabase.from('department_modules').delete().eq('department_id', departmentId)
    if (selectedModuleIds.length > 0) {
      await supabase.from('department_modules').insert(
        selectedModuleIds.map((module_id) => ({ department_id: departmentId, module_id }))
      )
    }

    // Documents
    await supabase.from('department_documents').delete().eq('department_id', departmentId)
    if (selectedDocumentIds.length > 0) {
      await supabase.from('department_documents').insert(
        selectedDocumentIds.map((document_id) => ({ department_id: departmentId, document_id }))
      )
    }

    toast.success('Department profile updated successfully.')
    setLoading(false)
  }

  const filteredDocuments =
    docTypeFilter === 'All'
      ? documents
      : documents.filter((d) => d.document_type === docTypeFilter)

  const documentTypes = ['All', ...Array.from(new Set(documents.map((d) => d.document_type)))]

  return (
    <>
      <div className="after-hero">
        <div className="page-content">
          <div className="neon-panel department-profile-panel">
            <h1 className="neon-form-title mb-4">
              Department Profile: {departmentName}
            </h1>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <>
                {/* MODULES */}
                <div className="mb-6">
                  <h2 className="neon-form-section-title mb-2">Modules</h2>
                  <ul className="department-profile-list">
                    {modules.map((mod) => (
                      <li key={mod.id}>
                        <label className="department-profile-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedModuleIds.includes(mod.id)}
                            onChange={() => handleModuleToggle(mod.id)}
                          />
                          {mod.title}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DOCUMENTS */}
                <div className="mb-6">
                  <h2 className="neon-form-section-title mb-2">Documents</h2>
                  <select
                    value={docTypeFilter}
                    onChange={(e) => setDocTypeFilter(e.target.value)}
                    className="department-profile-select"
                  >
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === 'All' ? 'All Types' : type}
                      </option>
                    ))}
                  </select>
                  <ul className="department-profile-list">
                    {filteredDocuments.map((doc) => (
                      <li key={doc.id}>
                        <label className="department-profile-checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={() => handleDocumentToggle(doc.id)}
                          />
                          {doc.title} <span className="department-profile-doc-type">({doc.document_type})</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={handleSave}
                  className="department-profile-save-btn"
                  disabled={loading}
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
