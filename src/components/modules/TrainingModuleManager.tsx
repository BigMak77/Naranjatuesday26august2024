'use client';

import React, { useEffect, useMemo, useState } from 'react';
import NeonTable from '@/components/NeonTable';
import FolderTabs from '@/components/FolderTabs';
import { supabase } from '@/lib/supabase-client';
import {
  FiClipboard,
  FiHelpCircle,
  FiPlus,
  FiSend,
  FiArchive,
  FiEdit,
  FiX,
} from 'react-icons/fi';

import AddModuleTab from '@/components/modules/AddModuleTab';
import AssignModuleTab from '@/components/modules/AssignModuleTab';
import NeonIconButton from '@/components/ui/NeonIconButton';
import NeonModuleForm, { NeonModuleFormField } from '@/components/NeonModuleForm';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string; // coerced to number for edit form
  is_archived: boolean;
  group_id: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function TrainingModuleManager() {
  const [activeTab, setActiveTab] = useState<'add' | 'view' | 'assign' | 'archive'>('view');
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState('');

  // Archive overlay state
  const [archiveModule, setArchiveModule] = useState<Module | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Edit overlay state
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [groupId, setGroupId] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);

  const tabList = [
    { key: 'add', label: '', icon: <FiPlus color="white" className="training-module-manager-tab-icon" /> },
    { key: 'view', label: '', icon: <FiClipboard color="white" className="training-module-manager-tab-icon" /> },
    { key: 'assign', label: '', icon: <FiSend color="white" className="training-module-manager-tab-icon" /> },
    { key: 'archive', label: '', icon: <FiHelpCircle color="white" className="training-module-manager-tab-icon" /> },
  ];

  const fetchModules = async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return;

    const cleaned = (data || []).map((m: Module) => ({
      ...m,
      learning_objectives: m.learning_objectives ?? '',
      estimated_duration: m.estimated_duration ?? '',
      delivery_format: m.delivery_format ?? '',
      target_audience: m.target_audience ?? '',
      prerequisites: m.prerequisites ?? [],
      thumbnail_url: m.thumbnail_url ?? '',
      tags: m.tags ?? [],
      created_at: m.created_at ?? new Date().toISOString(),
      updated_at: m.updated_at ?? new Date().toISOString(),
    })) as Module[];

    setModules(cleaned);
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // ESC closes overlays
  useEffect(() => {
    const openSomething = !!archiveModule || !!editModule || !!showVersionModal;
    if (!openSomething) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!archiveLoading && !savingEdit) {
          setArchiveModule(null);
          setEditModule(null);
          setShowVersionModal(false);
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [archiveModule, editModule, showVersionModal, archiveLoading, savingEdit]);

  // Seed edit form when opening
  useEffect(() => {
    if (!editModule) return;
    setEditError(null);
    setEditSuccess(false);
    setShowVersionModal(false);

    setName(editModule.name || '');
    setDescription(editModule.description || '');
    setVersion(Number(editModule.version) || 1);
    setGroupId(editModule.group_id || '');
    setLearningObjectives(editModule.learning_objectives || '');
    setEstimatedDuration(editModule.estimated_duration || '');
    setDeliveryFormat(editModule.delivery_format || '');
    setTargetAudience(editModule.target_audience || '');
    setThumbnailUrl(editModule.thumbnail_url || '');
    setPrerequisites(editModule.prerequisites || []);
  }, [editModule]);

  const filteredModules = useMemo(
    () =>
      modules
        .filter((m) => !m.is_archived) // Only non-archived modules
        .filter(
          (m) =>
            (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (m.description || '').toLowerCase().includes(search.toLowerCase())
        ),
    [modules, search]
  );

  // Edit overlay form fields
  const editFields: NeonModuleFormField[] = [
    { key: 'name', label: 'Name', type: 'text', value: name, onChange: setName, required: true },
    { key: 'description', label: 'Description', type: 'text', value: description, onChange: setDescription },
    { key: 'learningObjectives', label: 'Learning Objectives', type: 'textarea', value: learningObjectives, onChange: setLearningObjectives, rows: 2 },
    { key: 'groupId', label: 'Group ID', type: 'text', value: groupId, onChange: setGroupId, required: true },
    { key: 'estimatedDuration', label: 'Estimated Duration', type: 'text', value: estimatedDuration, onChange: setEstimatedDuration, placeholder: 'e.g. 1h 30m' },
    { key: 'deliveryFormat', label: 'Delivery Format', type: 'text', value: deliveryFormat, onChange: setDeliveryFormat },
    { key: 'targetAudience', label: 'Target Audience', type: 'text', value: targetAudience, onChange: setTargetAudience },
    { key: 'thumbnailUrl', label: 'Thumbnail URL', type: 'text', value: thumbnailUrl, onChange: setThumbnailUrl },
  ];

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowVersionModal(true);
  };

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    if (!editModule) return;
    setShowVersionModal(false);
    setEditError(null);
    setSavingEdit(true);

    try {
      let newVersion = version;
      if (isNewVersion) {
        newVersion = Number(version) + 1;
        setVersion(newVersion);
      }

      const { error } = await supabase
        .from('modules')
        .update({
          name,
          description,
          version: newVersion,
          group_id: groupId,
          learning_objectives: learningObjectives,
          estimated_duration: estimatedDuration,
          delivery_format: deliveryFormat,
          target_audience: targetAudience,
          prerequisites,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editModule.id);

      if (error) throw error;

      setEditSuccess(true);
      await fetchModules();
      setTimeout(() => {
        setEditSuccess(false);
        setEditModule(null);
      }, 900);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message || 'Failed to update module');
      } else {
        setEditError('Failed to update module');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="training-module-manager-container">
      <FolderTabs
        tabs={tabList}
        activeTab={activeTab}
        onChange={(tabKey) => {
          setActiveTab(tabKey as typeof activeTab);
          setArchiveModule(null);
          setEditModule(null);
          setShowVersionModal(false);
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
              onChange={(e) => setSearch(e.target.value)}
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
              { header: 'Actions', accessor: 'actions' },
            ]}
            data={filteredModules.map((m) => ({
              ...m,
              status: m.is_archived ? 'Archived' : 'Active',
              actions: (
                <div className="training-module-manager-actions-row">
                  <NeonIconButton
                    variant="edit"
                    icon={<FiEdit color="white" />}
                    title="Edit Module"
                    onClick={() => setEditModule(m)} // Open EDIT overlay
                    className="neon-btn"
                  />
                </div>
              ),
            }))}
          />
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules to archive..."
              className="training-module-manager-search-input"
            />
          </div>

          <NeonTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Description', accessor: 'description' },
              { header: 'Version', accessor: 'version' },
              { header: 'Archive', accessor: 'archive' },
            ]}
            data={modules
              .filter((m) => !m.is_archived)
              .map((m) => ({
                ...m,
                archive: (
                  <div className="training-module-manager-actions-row">
                    <NeonIconButton
                      variant="archive"
                      icon={<FiArchive color="white" />}
                      title="Archive Module"
                      onClick={() => setArchiveModule(m)} // Open ARCHIVE overlay
                      className="neon-btn"
                    />
                  </div>
                ),
              }))}
          />

          {/* Archive confirm overlay */}
          {archiveModule && (
            <div
              className="ui-dialog-overlay"
              style={{ zIndex: 60000 }}
              onClick={(e) => {
                if (e.target === e.currentTarget && !archiveLoading) setArchiveModule(null);
              }}
            >
              <div
                className="ui-dialog-content neon-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="archive-title"
                style={{ zIndex: 60001 }}
              >
                <h2
                  id="archive-title"
                  className="training-module-manager-archive-title neon-form-title"
                  style={{ marginBottom: '1.25rem' }}
                >
                  Archive Module
                </h2>

                <p className="training-module-manager-archive-desc">
                  Are you sure you want to archive{' '}
                  <span className="training-module-manager-archive-module-name">
                    {archiveModule.name}
                  </span>
                  ? This action cannot be undone.
                </p>

                <div
                  className="training-module-manager-archive-actions"
                  style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}
                >
                  <NeonIconButton
                    variant="archive"
                    icon={<FiArchive color="white" className="training-module-manager-btn-archive-icon" />}
                    title={archiveLoading ? 'Archiving…' : 'Archive'}
                    onClick={async () => {
                      if (archiveLoading) return;
                      setArchiveLoading(true);
                      const { error } = await supabase
                        .from('modules')
                        .update({ is_archived: true, updated_at: new Date().toISOString() })
                        .eq('id', archiveModule.id);

                      if (error) {
                        alert('Failed to archive module: ' + (error.message || 'Unknown error'));
                        setArchiveLoading(false);
                        return;
                      }

                      await fetchModules();
                      setArchiveLoading(false);
                      setArchiveModule(null);
                    }}
                    disabled={archiveLoading}
                    className="neon-btn"
                  />
                  <NeonIconButton
                    variant="cancel"
                    icon={<FiX color="white" />}
                    title="Cancel"
                    onClick={() => !archiveLoading && setArchiveModule(null)}
                    disabled={archiveLoading}
                    className="neon-btn"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT OVERLAY */}
      {editModule && (
        <div
          className="ui-dialog-overlay"
          style={{ zIndex: 60000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit) setEditModule(null);
          }}
        >
          <div
            className="ui-dialog-content neon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            style={{ zIndex: 60001, maxWidth: 720 }}
          >
            <NeonModuleForm
              title="Edit Module"
              fields={editFields}
              onSubmit={handleEditSubmit}
              error={editError}
              success={editSuccess}
            />
            <div className="neon-form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <NeonIconButton
                variant="cancel"
                icon={<FiX color="white" />}
                title="Close"
                onClick={() => {
                  if (!savingEdit) {
                    setEditModule(null);
                    setActiveTab('view');
                  }
                }}
                disabled={savingEdit}
                className="neon-btn"
              />
            </div>
          </div>
        </div>
      )}

      {/* Version confirm overlay (nested) */}
      {showVersionModal && (
        <div
          className="ui-dialog-overlay"
          style={{ zIndex: 60010 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingEdit) setShowVersionModal(false);
          }}
        >
          <div
            className="ui-dialog-content neon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-title"
            style={{ zIndex: 60011, maxWidth: 420 }}
          >
            <h2 id="version-title" className="font-title neon-text mb-2">
              Is this a new version of the module?
            </h2>
            <p className="font-body mb-4">
              If yes, the version number will be incremented automatically.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="neon-utility-btn neon-btn-save"
                onClick={() => handleVersionConfirm(true)}
                disabled={savingEdit}
                style={{ minWidth: 140 }}
              >
                Yes, new version
              </button>
              <button
                className="neon-utility-btn neon-btn-edit"
                onClick={() => handleVersionConfirm(false)}
                disabled={savingEdit}
                style={{ minWidth: 140 }}
              >
                No, keep version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
