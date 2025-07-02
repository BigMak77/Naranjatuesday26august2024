'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { FileText, ClipboardList, ShieldCheck } from 'lucide-react'

type Document = {
  id: string
  title: string
  document_type: string
  version: number
  file_url: string | null
  created_at: string | null
}

const typeLabels: Record<string, string> = {
  policy: 'Policy',
  work_instruction: 'Work Instruction',
  safe_system: 'Safe System of Work'
}

const typeIcons: Record<string, React.ReactNode> = {
  policy: <ShieldCheck className="inline w-4 h-4 text-teal-600 mr-1" />,
  work_instruction: <FileText className="inline w-4 h-4 text-orange-500 mr-1" />,
  safe_system: <ClipboardList className="inline w-4 h-4 text-purple-600 mr-1" />
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
      } else {
        setDocuments(data || [])
      }
      setLoading(false)
    }

    fetchDocs()
  }, [])

  const filteredDocs = documents.filter((doc) => {
    const matchesType = selectedType === 'All' || doc.document_type === selectedType
    const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <main className="min-h-screen flex flex-col bg-teal-50 text-teal-900">
      <section className="max-w-6xl mx-auto p-6 flex-1">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📁 All Documents</h1>
          <Link
            href="/admin/documents/add"
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded shadow text-sm"
          >
            ➕ Add Document
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded w-full md:w-1/2 bg-white text-black"
          />

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded w-full md:w-1/3 bg-white text-black"
          >
            <option value="All">All Types</option>
            <option value="policy">Policy</option>
            <option value="work_instruction">Work Instruction</option>
            <option value="safe_system">Safe System of Work</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : filteredDocs.length === 0 ? (
          <p className="text-gray-500 italic">No matching documents found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-xl shadow border border-teal-100 flex flex-col justify-between"
              >
                <div className="mb-3 space-y-1">
                  <h2 className="text-xl font-semibold text-teal-800">{doc.title}</h2>
                  <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                    <span className="capitalize flex items-center">
                      {typeIcons[doc.document_type]}
                      {typeLabels[doc.document_type]}
                    </span>
                    <span>🔢 v{doc.version}</span>
                    <span>
                      📅{' '}
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm mt-3">
                  {doc.file_url ? (
                    <>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                      <a
                        href={doc.file_url}
                        download
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded"
                      >
                        Download
                      </a>
                    </>
                  ) : (
                    <span className="italic text-gray-400">No file</span>
                  )}

                  <Link
                    href={`/admin/documents/edit?id=${doc.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
