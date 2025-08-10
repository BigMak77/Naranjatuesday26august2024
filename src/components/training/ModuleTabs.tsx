import React, { useState } from 'react'
import FolderTabs from '@/components/FolderTabs'
import NeonPanel from '@/components/NeonPanel'
import NeonIconButton from '../ui/NeonIconButton';
import { FiEdit, FiEye } from 'react-icons/fi';

interface ModuleTabsProps {
  module: any
  onEdit?: () => void
  onCancel?: () => void
}

const tabList = [
  { key: 'overview', label: 'Overview', value: 'Overview', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg></span> },
  { key: 'edit', label: 'Edit', value: 'Edit', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></span> },
  { key: 'assign', label: 'Assign', value: 'Assign', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19v-7m0 0l-3.5 3.5M12 12l3.5 3.5"/></svg></span> },
  { key: 'assignments', label: 'Assignments', value: 'Assignments', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg></span> },
  { key: 'history', label: 'History', value: 'History', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span> },
  { key: 'resources', label: 'Resources', value: 'Resources', icon: <span className="inline-block"><svg width="20" height="20" fill="none" stroke="#40E0D0" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/></svg></span> }
]

export default function ModuleTabs({ module, onEdit, onCancel }: ModuleTabsProps) {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <>
      <FolderTabs
        tabs={tabList}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <NeonPanel className="neon-panel-module mt-4">
        {activeTab === 'Overview' && (
          <>
            <h1 className="neon-module-title mb-4">{module.name}</h1>
            <p className="neon-module-desc mb-2">{module.description}</p>
            <div className="mb-2">Version: <span className="neon-module-meta">{module.version}</span></div>
            <div className="mb-2">Status: <span className={`neon-module-status ${module.is_archived ? 'neon-status-archived' : 'neon-status-active'}`}>{module.is_archived ? 'Archived' : 'Active'}</span></div>
            <div className="mb-2">Group ID: <span className="neon-module-meta font-mono">{module.group_id}</span></div>
            <div className="mb-2">Learning Objectives: <span>{module.learning_objectives || '—'}</span></div>
            <div className="mb-2">Estimated Duration: <span>{module.estimated_duration || '—'}</span></div>
            <div className="mb-2">Delivery Format: <span>{module.delivery_format || '—'}</span></div>
            <div className="mb-2">Target Audience: <span>{module.target_audience || '—'}</span></div>
            <div className="mb-2">Prerequisites: <span>{(module.prerequisites && module.prerequisites.length > 0) ? module.prerequisites.join(', ') : '—'}</span></div>
            <div className="mb-2">Tags: <span>{(module.tags && module.tags.length > 0) ? module.tags.join(', ') : '—'}</span></div>
            <div className="mb-2">Created At: <span>{module.created_at ? new Date(module.created_at).toLocaleString() : '—'}</span></div>
            <div className="mb-2">Updated At: <span>{module.updated_at ? new Date(module.updated_at).toLocaleString() : '—'}</span></div>
            {onEdit && <NeonIconButton variant="edit" icon={<FiEdit />} title="Edit Module" onClick={onEdit} className="mt-6" />}
            {onCancel && <NeonIconButton variant="view" icon={<FiEye />} title="Cancel" onClick={onCancel} className="mt-2 ml-4" />}
          </>
        )}
        {activeTab === 'Edit' && (
          <div className="neon-info py-8 text-center text-lg">Edit tab coming soon...</div>
        )}
        {activeTab === 'Assign' && (
          <div className="neon-info py-8 text-center text-lg">Assign tab coming soon...</div>
        )}
        {activeTab === 'Assignments' && (
          <div className="neon-info py-8 text-center text-lg">Assignments tab coming soon...</div>
        )}
        {activeTab === 'History' && (
          <div className="neon-info py-8 text-center text-lg">History tab coming soon...</div>
        )}
        {activeTab === 'Resources' && (
          <div className="neon-info py-8 text-center text-lg">Resources tab coming soon...</div>
        )}
      </NeonPanel>
    </>
  )
}
