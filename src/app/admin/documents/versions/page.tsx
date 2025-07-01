'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_url: string
  created_at: string
  notes: string | null
  document_title?: string
}

export default function DocumentVersionsPage() {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersions = async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*, document:documents(title)')
        .order('created_at', { ascending: false })

      console.log('Fetched versions:', data)

      if (error) {
        console.error('Error fetching document versions:', error)
        setLoading(false)
        return
      }

      const mapped = (data || []).map((v: any) => ({
        ...v,
        document_title: v.document?.title || 'Untitled',
      }))

      setVersions(mapped)
      setLoading(false)
    }

    fetchVersions()
  }, [])

  return (
    <main className="min-h-screen bg-white text-teal-900 flex flex-col">
      <LogoHeader />

      <section className="max-w-6xl mx-auto p-6 flex-1">
        <h1 className="text-3xl font-bold mb-6 text-teal-800">📚 Document Version History</h1>

        {loading ? (
          <p className="text-gray-500">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="italic text-gray-500">No version records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-teal-100 text-teal-900 text-left text-sm">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2 text-center">Version</th>
                  <th className="px-4 py-2 text-center">Created</th>
                  <th className="px-4 py-2 text-center">File</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-t hover:bg-teal-50">
                    <td className="px-4 py-2">{v.document_title}</td>
                    <td className="px-4 py-2 text-center">{v.version_number}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600">
                      {new Date(v.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {v.file_url ? (
                        <a
                          href={v.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No file</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {v.notes || <span className="text-gray-400 italic">No notes</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/admin/documents"
            className="text-sm text-teal-700 underline hover:text-teal-900"
          >
            ← Back to Documents
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
