'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import Footer from '@/components/Footer'

type DocumentType = 'policy' | 'work_instruction' | 'safe_system'

export default function AddDocumentPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('policy')
  const [version, setVersion] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!title.trim() || !file) {
      setError('Title and file are required.')
      return
    }

    setSubmitting(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setError('Failed to upload file.')
      setSubmitting(false)
      return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${fileName}`

    const { error: insertError } = await supabase.from('documents').insert([
      {
        title: title.trim(),
        document_type: documentType,
        version,
        file_url: fileUrl,
        created_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error('Insert error:', insertError)
      setError('Failed to save document.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/admin/documents'), 1200)
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <section className="max-w-2xl mx-auto p-6 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-teal-800">➕ Add New Document</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">✅ Document added successfully!</p>}

        <form onSubmit={handleSubmit} className="space-y-5 bg-teal-50 p-6 rounded-lg border shadow">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            >
              <option value="policy">Policy</option>
              <option value="work_instruction">Work Instruction</option>
              <option value="safe_system">Safe System of Work</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Version</label>
            <input
              type="number"
              value={version}
              onChange={(e) => setVersion(Math.max(1, Number(e.target.value)))}
              min={1}
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  )
}
