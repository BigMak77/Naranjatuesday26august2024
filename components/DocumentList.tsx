'use client'
import React from 'react'

type Document = {
  id: string
  title: string
  file_url?: string | null
  version_number?: number | null
  current_version?: number | null
}

export default function DocumentList({
  documents,
  type,
}: {
  documents: Document[]
  type: 'policy' | 'work'
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold text-orange-600 mb-2">
        {type === 'policy' ? '📋 Policies' : '🛠️ Work Instructions'}
      </h3>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-500">No {type}s found.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => {
            const version = doc.version_number ?? doc.current_version ?? '—'
            const hasFile = doc.file_url && doc.file_url.trim() !== ''

            return (
              <li
                key={doc.id}
                className="p-3 border border-teal-200 rounded bg-white shadow-sm"
              >
                <div className="font-medium text-teal-800">{doc.title}</div>
                <div className="text-sm text-gray-600">Version: {version}</div>

                {hasFile ? (
                  <div className="flex gap-3 mt-2">
                    <a
                      href={doc.file_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      View
                    </a>
                    <a
                      href={doc.file_url!}
                      download
                      className="text-sm text-white bg-teal-600 hover:bg-teal-700 px-3 py-1 rounded"
                    >
                      Download
                    </a>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 mt-2">
                    No file available
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
