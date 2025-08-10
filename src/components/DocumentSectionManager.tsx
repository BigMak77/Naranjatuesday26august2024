/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonTable from '@/components/NeonTable'
import { FiArchive, FiFileText, FiBookOpen, FiClipboard, FiPlus } from 'react-icons/fi'
import { useUser } from '@/lib/useUser'

interface Document {
  id: string
  title: string
  section_id?: string | null
  document_type: string
  created_at?: string
  current_version?: number
  reference_code?: string
  file_url?: string
  notes?: string
  archived?: boolean
}

interface Section {
  id: string
  code: string
  title: string
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveDocId, setArchiveDocId] = useState<string | null>(null)
  const [changeSummary, setChangeSummary] = useState('')
  const [archiveErrorMsg, setArchiveErrorMsg] = useState('')
  const [buttonLoading, setButtonLoading] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    const fetchData = async () => {
      const { data: docs, error: docsErr } = await supabase
        .from('documents')
        .select('id, title, section_id, document_type, created_at, current_version, reference_code, file_url, notes, archived')
      if (docsErr) console.error('Error fetching documents:', docsErr)

      const { data: secs, error: secsErr } = await supabase
        .from('standard_sections')
        .select('id, code, title')
      if (secsErr) console.error('Error fetching sections:', secsErr)

      setDocuments((docs || []).filter(doc => !doc.archived))
      setSections(secs || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, filterType, filterSection])

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType ? doc.document_type === filterType : true
    const matchesSection = filterSection ? doc.section_id === filterSection : true
    return matchesSearch && matchesType && matchesSection
  })

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  const handlePageChange = (dir: 'prev' | 'next') => {
    if (dir === 'prev' && page > 1) setPage(page - 1)
    if (dir === 'next' && page < totalPages) setPage(page + 1)
  }

  const handleArchiveClick = async (id: string) => {
    if (buttonLoading) return; // Prevent double click
    setButtonLoading(id)
    setArchiveDocId(id)
    setChangeSummary('')
    setArchiveErrorMsg('')
    setShowArchiveModal(true)
  }

  const handleArchiveSubmit = async () => {
    if (!changeSummary.trim()) {
      setArchiveErrorMsg('Change summary is required.')
      return
    }
    if (!archiveDocId) return
    setShowArchiveModal(false)
    setButtonLoading(archiveDocId)
    await archiveDocument(archiveDocId, changeSummary)
    setArchiveDocId(null)
    setChangeSummary('')
    setButtonLoading(null)
  }

  const archiveDocument = async (id: string, summary: string) => {
    setLoading(true)
    if (!user?.auth_id) {
      alert('Cannot archive: user not loaded. Please refresh and try again.')
      setLoading(false)
      return
    }

    const { data: doc, error: fetchError } = await supabase.from('documents').select('*').eq('id', id).single()
    if (fetchError || !doc) {
      alert('Failed to fetch document for archiving.')
      setLoading(false)
      return
    }

    const { data: archiveData, error: archiveError } = await supabase.from('document_archive').insert({
      document_id: doc.id,
      archived_version: doc.current_version || 1,
      title: doc.title,
      reference_code: doc.reference_code,
      file_url: doc.file_url,
      document_type: doc.document_type,
      notes: doc.notes || null,
      section_id: doc.section_id || null,
      created_at: doc.created_at || null,
      change_summary: summary,
      change_date: new Date().toISOString(),
      archived_by_auth_id: user.auth_id,
    })

    if (archiveError) {
      console.error('Error archiving document:', archiveError)
      alert('Failed to archive document: ' + archiveError.message)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('documents').update({ archived: true }).eq('id', id)
    if (error) {
      alert('Failed to archive document.')
    } else {
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      alert('Document archived.')
    }
    setLoading(false)
  }

  return (
    <>
      {/* Archive Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 border-2 border-teal-400 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-teal-300 mb-2">Archive Document</h2>
            <label className="block text-sm text-white mb-1" htmlFor="changeSummary">Change Summary <span className="text-red-400">*</span></label>
            <textarea
              id="changeSummary"
              value={changeSummary}
              onChange={e => setChangeSummary(e.target.value)}
              className="w-full h-24 p-2 rounded border border-teal-400 bg-gray-800 text-white mb-2"
              placeholder="Describe why this document is being archived..."
              required
            />
            {archiveErrorMsg && <p className="text-red-400 text-sm mb-2">{archiveErrorMsg}</p>}
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                onClick={() => { setShowArchiveModal(false); setArchiveDocId(null); setChangeSummary(''); setButtonLoading(null); }}
                disabled={!!buttonLoading}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 font-bold"
                onClick={handleArchiveSubmit}
                disabled={!!buttonLoading}
              >{buttonLoading ? 'Archiving...' : 'Archive'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-10 px-10">
        <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
          <div className="neon-search-bar-wrapper">
            <input
              type="search"
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="neon-input neon-input-search"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded h-10 w-full md:w-1/4 min-w-[180px] max-w-[220px]"
          >
            <option value="">All Types</option>
            <option value="policy">Policy</option>
            <option value="ssow">SSOW</option>
            <option value="work_instruction">Work Instruction</option>
          </select>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="border rounded h-10 w-full md:w-1/4 min-w-[180px] max-w-[220px]"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.code} – {s.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/documents/add')}
            className="bg-teal-600 text-white rounded shadow hover:bg-teal-700 flex items-center justify-center h-10 w-10"
            title="Add Document"
            style={{ minWidth: 40, minHeight: 40, padding: 0 }}
            disabled={!!buttonLoading}
          >
            <FiPlus size={22} style={{ color: '#fff', display: 'block' }} />
            <span className="sr-only">Add Document</span>
          </button>
          <button
            onClick={() => router.push('/admin/documents/archived')}
            className="bg-teal-600 text-white rounded shadow hover:bg-teal-700 flex items-center justify-center h-10 w-10"
            title="View Archived Documents"
            style={{ minWidth: 40, minHeight: 40, padding: 0 }}
            disabled={!!buttonLoading}
          >
            <FiArchive size={22} style={{ color: '#fff', display: 'block' }} />
            <span className="sr-only">Archived Documents</span>
          </button>
        </div>
      </div>

      {loading ? (
        <p className="p-6 text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="flex justify-between items-center px-10 mt-4">
            <p className="text-sm text-white">Showing {paged.length} of {filtered.length} matching documents</p>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border rounded text-sm"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>

          <div className="px-10 mt-2">
            <NeonTable
              columns={[
                { header: 'Title', accessor: 'title' },
                { header: 'Type', accessor: 'document_type' },
                { header: 'Section', accessor: 'section' },
                { header: 'Created', accessor: 'created' },
                { header: 'Version', accessor: 'version' },
                { header: 'Edit', accessor: 'edit' },
                { header: 'Archive', accessor: 'archive' },
              ]}
              data={paged.map((doc: Document) => {
                const section = sections.find(s => s.id === doc.section_id)
                let typeIcon = null
                if (doc.document_type === 'policy') {
                  typeIcon = <FiFileText size={18} className="text-orange-400 mx-auto" title="Policy" />
                } else if (doc.document_type === 'ssow') {
                  typeIcon = <FiClipboard size={18} className="text-teal-400 mx-auto" title="SSOW" />
                } else if (doc.document_type === 'work_instruction') {
                  typeIcon = <FiBookOpen size={18} className="text-blue-400 mx-auto" title="Work Instruction" />
                }
                return {
                  title: doc.title,
                  document_type: <div className="flex justify-center items-center">{typeIcon}</div>,
                  section: section ? `${section.code} – ${section.title}` : '—',
                  created: doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-GB') : '—',
                  version: <div className="flex justify-center items-center">{doc.current_version || '—'}</div>,
                  edit: (
                    <div className="flex justify-center items-center">
                      <a href={`/admin/documents/edit/${doc.id}`} title="Edit document">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400 hover:text-teal-600 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0l-9.192 9.192a2 2 0 00-.497.879l-1 4A1 1 0 004 18a1 1 0 00.242-.03l4-1a2 2 0 00.879-.497l9.192-9.192a2 2 0 000-2.828zM5.121 16.121l-1-4 9.192-9.192 4 4-9.192 9.192z" />
                        </svg>
                      </a>
                    </div>
                  ),
                  archive: user?.auth_id ? (
                    <div className="flex justify-center items-center">
                      <FiArchive
                        size={18}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        title="Archive document"
                        onClick={() => handleArchiveClick(doc.id)}
                      />
                    </div>
                  ) : '—',
                }
              })}
            />
          </div>

          <div className="flex justify-between items-center px-10 mt-4">
            <button
              disabled={page === 1}
              onClick={() => handlePageChange('prev')}
              className="bg-teal-600 text-white rounded disabled:opacity-50 px-3 py-1"
            >
              ◀ Prev
            </button>
            <span className="text-sm text-white">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => handlePageChange('next')}
              className="bg-teal-600 text-white rounded disabled:opacity-50 px-3 py-1"
            >
              Next ▶
            </button>
          </div>
        </>
      )}
    </>
  )
}
