'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import LogoHeader from '@/components/LogoHeader'
import Footer from '@/components/Footer'

type DocumentType = 'policy' | 'work_instruction' | 'safe_system'

export default function EditDocumentPage() {
  const router = useRouter()
  const params = useSearchParams()
  const documentId = params.get('id')

  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('policy')
  const [version, setVersion] = useState(1)
  const [fileUrl, setFileUrl] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!documentId) return

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error || !data) {
        setError('Failed to load document.')
        setLoading(false)
        return
      }

      setTitle(data.title)
      setDocumentType(data.document_type)
      setVersion(data.version)
      setFileUrl(data.file_url)
      setLoading(false)
    }

    fetchData()
  }, [documentId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!title || isNaN(version)) {
      setError('Title and version are required.')
      return
    }

    let finalFileUrl = fileUrl

    if (newFile) {
      const fileExt = newFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, newFile)

      if (uploadError) {
        setError('Failed to upload new file.')
        return
      }

      finalFileUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/documents/${filePath}`
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        title,
        document_type: documentType,
        version,
        file_url: finalFileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateError) {
      setError('Failed to update document.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/admin/documents'), 1000)
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        <LogoHeader />
        <p>Loading document...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-white text-teal-900">
      <LogoHeader />

      <section className="max-w-2xl mx-auto p-6 flex-1">
        <h1 className="text-2xl font-bold mb-6 text-teal-800">✏️ Edit Document</h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {success && <p className="text-green-600 mb-4">✅ Document updated successfully!</p>}

        <form onSubmit={handleUpdate} className="space-y-5 bg-teal-50 p-6 rounded-lg border shadow">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Document Type</label>
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
            <label className="block text-sm font-medium mb-1 text-gray-700">Version</label>
            <input
              type="number"
              value={version}
              min={1}
              onChange={(e) => setVersion(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Replace File (optional)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 px-3 py-2 rounded bg-white"
            />
            {!newFile && fileUrl && (
              <p className="text-sm text-gray-500 mt-1">
                Current file:{' '}
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  View PDF
                </a>
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded transition disabled:opacity-50"
            >
              Update Document
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  )
}
