import React from 'react'
import NeonPanel from '@/components/NeonPanel'
import { FiEdit } from 'react-icons/fi'

export default function ViewModuleTab({ module }: { module: any }) {
  if (!module) return <NeonPanel className="p-6">No module selected.</NeonPanel>
  return (
    <NeonPanel className="p-6">
      <div className="flex gap-2 mb-6">
        <button className="btn-edit" data-tooltip="Edit">
          <FiEdit />
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-4">{module.name}</h1>
      <p className="mb-2 text-lg">{module.description}</p>
      <div className="mb-2">Version: <span className="font-semibold">{module.version}</span></div>
      <div className="mb-2">Status: <span className="font-semibold">{module.is_archived ? 'Archived' : 'Active'}</span></div>
      <div className="mb-2">Group ID: <span className="font-mono">{module.group_id}</span></div>
      <div className="mb-2">Learning Objectives: <span>{module.learning_objectives || '—'}</span></div>
      <div className="mb-2">Estimated Duration: <span>{module.estimated_duration || '—'}</span></div>
      <div className="mb-2">Delivery Format: <span>{module.delivery_format || '—'}</span></div>
      <div className="mb-2">Target Audience: <span>{module.target_audience || '—'}</span></div>
      <div className="mb-2">Prerequisites: <span>{(module.prerequisites && module.prerequisites.length > 0) ? module.prerequisites.join(', ') : '—'}</span></div>
      <div className="mb-2">Tags: <span>{(module.tags && module.tags.length > 0) ? module.tags.join(', ') : '—'}</span></div>
      <div className="mb-2">Created At: <span>{module.created_at ? new Date(module.created_at).toLocaleString() : '—'}</span></div>
      <div className="mb-2">Updated At: <span>{module.updated_at ? new Date(module.updated_at).toLocaleString() : '—'}</span></div>
    </NeonPanel>
  )
}
