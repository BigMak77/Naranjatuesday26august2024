import React from 'react'
import NeonPanel from '@/components/NeonPanel'
import { FiArchive } from 'react-icons/fi'

export default function ArchiveModuleTab({ module, onArchive }: { module: any, onArchive: () => void }) {
  if (!module) return <NeonPanel className="p-6">No module selected.</NeonPanel>
  return (
    <NeonPanel className="p-6">
      <h1 className="text-2xl font-bold mb-4">Archive Module</h1>
      <p className="mb-2">Are you sure you want to archive the module <span className="font-semibold">{module.name}</span>?</p>
      <div className="mb-4">Archiving will mark this module as inactive and hide it from active lists, but will not delete any data.</div>
      <div className="flex gap-4">
        <button
          onClick={onArchive}
          className="btn-archive"
          data-tooltip="Archive Module"
        >
          <FiArchive />
        </button>
      </div>
    </NeonPanel>
  )
}
