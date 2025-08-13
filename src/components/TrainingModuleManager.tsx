'use client'

import React, { useEffect, useState } from 'react'
import NeonTable from '@/components/NeonTable'
import FolderTabs from '@/components/FolderTabs'
import { supabase } from '@/lib/supabase-client'
import {
  FiClipboard,
  FiHelpCircle,
  FiPlus,
  FiSend,
  FiArchive,
  FiEdit
} from 'react-icons/fi'

import AddModuleTab from '@/components/AddModuleTab'
import ViewModuleTab from '@/components/ViewModuleTab'
import AssignModuleTab from '@/components/AssignModuleTab'

import './folder-tabs-equal-width.css'

export default function TrainingModuleManager() {
  const [activeTab, setActiveTab] = useState<'add' | 'view' | 'assign' | 'archive'>('view')
  const [modules, setModules] = useState<any[]>([])
  const [selectedModule, setSelectedModule] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [search, setSearch] = useState('')
  const [archiveLoading, setArchiveLoading] = useState(false)

  const tabList = [
    { key: 'add', label: 'Add Module', icon: <FiPlus className="inline text-lg align-middle" /> },
    { key: 'view', label: 'View Modules', icon: <FiClipboard className="inline text-lg align-middle" /> },
    { key: 'assign', label: 'Assign Module', icon: <FiSend className="inline text-lg align-middle" /> },
    { key: 'archive', label: 'Archive Module', icon: <FiHelpCircle className="inline text-lg align-middle" /> }
  ]

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Failed to load modules')
        setLoading(false)
        return
      }

      const cleaned = (data || []).map(m => ({
        ...m,
        learning_objectives: m.learning_objectives ?? '',
        estimated_duration: m.estimated_duration ?? '',
        delivery_format: m.delivery_format ?? '',
        target_audience: m.target_audience ?? '',
        prerequisites: m.prerequisites ?? [],
        thumbnail_url: m.thumbnail_url ?? '',
        tags: m.tags ?? [],
        created_at: m.created_at ?? new Date().toISOString(),
        updated_at: m.updated_at ?? new Date().toISOString()
      }))
      setModules(cleaned)
      setLoading(false)
    }

    fetchModules()
  }, [])

  useEffect(() => {
    setSaveSuccess(false)
    setLoading(false)
  }, [activeTab])

  const filteredModules = modules.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="training-module-manager-container">
      <FolderTabs
        tabs={tabList}
        activeTab={activeTab}
        onChange={(tabKey) => {
          setActiveTab(tabKey as typeof activeTab)
          setSelectedModule(null)
          setLoading(false)
        }}
      />
      <div className="training-module-manager-tab-spacer" />
      {activeTab === 'add' && (
        <div className="training-module-manager-tab-content">
          <AddModuleTab onSuccess={() => setActiveTab('view')} />
        </div>
      )}
      {activeTab === 'view' && (
        <div className="training-module-manager-tab-content">
          <div className="training-module-manager-search-row">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="training-module-manager-search-input"
            />
          </div>
          <NeonTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Description', accessor: 'description' },
              { header: 'Version', accessor: 'version' },
              { header: 'Status', accessor: 'status' },
              { header: 'Actions', accessor: 'actions' }
            ]}
            data={filteredModules.map((m) => ({
              ...m,
              status: m.is_archived ? 'Archived' : 'Active',
              actions: (
                <div className="training-module-manager-actions-row">
                  <button
                    className="training-module-manager-btn-edit"
                    data-tooltip="Edit"
                    type="button"
                    onClick={() => window.location.href = `/admin/modules/edit/${m.id}`}
                  >
                    <FiEdit />
                  </button>
                </div>
              )
            }))}
          />
          {selectedModule && <ViewModuleTab module={selectedModule} />}
        </div>
      )}
      {activeTab === 'assign' && (
        <div className="training-module-manager-tab-content">
          <AssignModuleTab />
        </div>
      )}
      {activeTab === 'archive' && (
        <div className="training-module-manager-tab-content">
          <div className="training-module-manager-search-row">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules to archive..."
              className="training-module-manager-search-input"
            />
          </div>
          <NeonTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Description', accessor: 'description' },
              { header: 'Version', accessor: 'version' },
              { header: 'Archive', accessor: 'archive' }
            ]}
            data={modules.filter(m => !m.is_archived).map((m) => ({
              ...m,
              archive: (
                <div className="training-module-manager-actions-row">
                  <button
                    className="training-module-manager-btn-archive"
                    data-tooltip="Archive"
                    onClick={() => setSelectedModule(m)}
                    type="button"
                  >
                    <FiArchive />
                  </button>
                </div>
              ),
            }))}
          />
          {selectedModule && (
            <div className="training-module-manager-archive-confirm">
              <h2 className="training-module-manager-archive-title">Archive Module</h2>
              <p className="training-module-manager-archive-desc">
                Are you sure you want to archive{' '}
                <span className="training-module-manager-archive-module-name">{selectedModule.name}</span>? This action cannot be undone.
              </p>
              <div className="training-module-manager-archive-actions">
                <button
                  className="training-module-manager-btn-archive"
                  onClick={async () => {
                    setArchiveLoading(true)
                    await supabase
                      .from('modules')
                      .update({ is_archived: true, updated_at: new Date().toISOString() })
                      .eq('id', selectedModule.id)
                    setModules(modules => modules.map(mod =>
                      mod.id === selectedModule.id ? { ...mod, is_archived: true } : mod
                    ))
                    setSelectedModule(null)
                    setArchiveLoading(false)
                  }}
                  disabled={archiveLoading}
                >
                  {archiveLoading ? 'Archiving...' : <><FiArchive className="training-module-manager-btn-archive-icon" /> Archive</>}
                </button>
                <button
                  className="training-module-manager-btn-cancel"
                  onClick={() => setSelectedModule(null)}
                  disabled={archiveLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
