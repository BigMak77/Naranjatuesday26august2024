'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Policy = {
  id: string
  title: string
  file_url: string | null
  created_at: string | null
  current_version: number
  category_id: string | null
}

type Props = {
  policy: Policy
  categoryName: string | null
  departmentName?: string | null
  onDelete?: () => void
}

export default function PolicyCard({
  policy,
  categoryName,
  departmentName,
  onDelete,
}: Props) {
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('policies').delete().eq('id', policy.id)
    setDeleting(false)
    setConfirmOpen(false)

    if (error) {
      alert('Failed to delete policy.')
      console.error(error)
    } else {
      onDelete?.()
    }
  }

  return (
    <li className="border border-teal-200 rounded bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <h2 className="font-semibold text-lg text-teal-800">{policy.title}</h2>
          <p className="text-sm text-gray-500">
            Version {policy.current_version}
            {policy.created_at &&
              ` · Created: ${new Date(policy.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}`}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {categoryName && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">
                {categoryName}
              </span>
            )}
            {departmentName && (
              <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                Dept: {departmentName}
              </span>
            )}
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
              v{policy.current_version}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm min-w-[140px] items-end">
          {policy.file_url ? (
            <>
              <a
                href={policy.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
              <a
                href={policy.file_url}
                download
                className="text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded"
              >
                Download
              </a>
            </>
          ) : (
            <span className="text-gray-400 italic">No file</span>
          )}

          <div className="flex gap-2 mt-2">
            <Link
              href={`/admin/documents/edit?id=${policy.id}`}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded"
            >
              Edit
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Policy</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{policy.title}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  )
}
