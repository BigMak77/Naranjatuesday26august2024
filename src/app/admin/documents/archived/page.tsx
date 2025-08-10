"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonTable from '@/components/NeonTable'
import HeroHeader from '@/components/HeroHeader'
import { FiFileText, FiClipboard, FiBookOpen } from 'react-icons/fi'

export default function ArchivedDocumentsPage() {
  const [archivedDocs, setArchivedDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArchived = async () => {
      const { data, error } = await supabase
        .from('document_archive')
        .select('id, document_id, title, archived_version, file_url, document_type, change_date, archived_by_auth_id')
        .order('change_date', { ascending: false })
      if (error) {
        setArchivedDocs([])
      } else {
        setArchivedDocs(data || [])
      }
      setLoading(false)
    }
    fetchArchived()
  }, [])

  return (
    <main className="min-h-screen text-teal-900 flex flex-col">
      <HeroHeader title="Archived Documents" subtitle="View all archived document versions" />
      <div style={{ marginBottom: '2.5rem' }} />
      <div style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }}>
        <button
          onClick={() => window.history.back()}
          className="bg-teal-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-teal-700 transition mb-6 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M15.5 19a1 1 0 0 1-.7-1.7l5.3-5.3H4a1 1 0 1 1 0-2h16.1l-5.3-5.3a1 1 0 0 1 1.4-1.4l7 7a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-.7.3Z"/></svg>
          <span>Back</span>
        </button>
        {loading ? (
          <p className="text-gray-600 m-0 p-0">Loading...</p>
        ) : (
          <NeonTable
            columns={[
              { header: 'Title', accessor: 'title' },
              { header: 'Type', accessor: 'document_type' },
              { header: 'Version', accessor: 'archived_version' },
              { header: 'Date Archived', accessor: 'change_date' },
              { header: 'Archived By', accessor: 'archived_by_auth_id' },
              { header: 'File', accessor: 'file_url' },
            ]}
            data={archivedDocs.map(doc => {
              let typeIcon = null
              if (doc.document_type === 'policy') typeIcon = <FiFileText className="text-orange-400 mx-auto" title="Policy" style={{ fontSize: 18 }} />
              else if (doc.document_type === 'ssow') typeIcon = <FiClipboard className="text-teal-400 mx-auto" title="SSOW" style={{ fontSize: 18 }} />
              else if (doc.document_type === 'work_instruction') typeIcon = <FiBookOpen className="text-blue-400 mx-auto" title="Work Instruction" style={{ fontSize: 18 }} />
              return {
                title: doc.title,
                document_type: <div className="flex justify-center items-center">{typeIcon}</div>,
                archived_version: doc.archived_version,
                change_date: doc.change_date ? new Date(doc.change_date).toLocaleString('en-GB') : '—',
                archived_by_auth_id: doc.archived_by_auth_id || '—',
                file_url: doc.file_url ? (
                  <a href={doc.file_url} rel="noopener noreferrer" className="text-teal-400 underline">View PDF</a>
                ) : '—',
              }
            })}
          />
        )}
      </div>
    </main>
  )
}
