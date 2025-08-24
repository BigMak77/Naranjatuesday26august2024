'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import NeonModuleForm, { NeonModuleFormField } from '@/components/NeonModuleForm';

// --- helpers ---
const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

const extractUuidFromPath = (path: string | null) => {
  if (!path) return null;
  const m = path.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/);
  return m ? m[0] : null;
};

export interface Module {
  id: string;
  name: string;
  description?: string;
  version?: number;
  is_archived?: boolean;
  group_id?: string;
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

export function ViewModuleTab({ module }: { module: Module }) {
  // Display module details in read-only mode
  return (
    <div className="view-module-tab">
      <h2 className="view-module-title">{module.name}</h2>
      <p className="view-module-description">{module.description}</p>
      <div className="view-module-meta">Version: <span>{module.version}</span></div>
      <div className="view-module-meta">Status: <span>{module.is_archived ? 'Archived' : 'Active'}</span></div>
      <div className="view-module-meta">Group ID: <span>{module.group_id}</span></div>
      <div className="view-module-meta">Learning Objectives: <span>{module.learning_objectives || '—'}</span></div>
      <div className="view-module-meta">Estimated Duration: <span>{module.estimated_duration || '—'}</span></div>
      <div className="view-module-meta">Delivery Format: <span>{module.delivery_format || '—'}</span></div>
      <div className="view-module-meta">Target Audience: <span>{module.target_audience || '—'}</span></div>
      <div className="view-module-meta">Prerequisites: <span>{(module.prerequisites && module.prerequisites.length > 0) ? module.prerequisites.join(', ') : '—'}</span></div>
      <div className="view-module-meta">Tags: <span>{(module.tags && module.tags.length > 0) ? module.tags.join(', ') : '—'}</span></div>
      <div className="view-module-meta">Created At: <span>{module.created_at ? new Date(module.created_at).toLocaleString() : '—'}</span></div>
      <div className="view-module-meta">Updated At: <span>{module.updated_at ? new Date(module.updated_at).toLocaleString() : '—'}</span></div>
    </div>
  );
}

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const pathname = usePathname();

  // derive id safely from params, else try the pathname
  const derivedId = useMemo(() => {
    const fromParams = Array.isArray(params?.id) ? params?.id?.[0] : params?.id;
    if (isUuid(fromParams)) return fromParams || null;
    const fromPath = extractUuidFromPath(pathname);
    return isUuid(fromPath) ? fromPath : null;
  }, [params?.id, pathname]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  // form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState<number>(1);
  const [groupId, setGroupId] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // fetch module
  useEffect(() => {
    const run = async () => {
      if (!derivedId) {
        setError('Invalid or missing module ID in URL.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', derivedId)
        .eq('is_archived', false) // Only fetch non-archived modules
        .single();

      if (error || !data) {
        setError('Module not found');
        setLoading(false);
        return;
      }

      setName(data.name || '');
      setDescription(data.description || '');
      setVersion(typeof data.version === 'number' ? data.version : Number(data.version ?? 1) || 1);
      setGroupId(data.group_id || '');
      setLearningObjectives(data.learning_objectives || '');
      setEstimatedDuration(data.estimated_duration || '');
      setDeliveryFormat(data.delivery_format || '');
      setTargetAudience(data.target_audience || '');
      setPrerequisites(Array.isArray(data.prerequisites) ? data.prerequisites : []);
      setThumbnailUrl(data.thumbnail_url || '');
      setLoading(false);
    };

    run();
  }, [derivedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowVersionModal(true);
  };

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    setShowVersionModal(false);
    setError(null);

    if (!derivedId) {
      setError('Invalid module ID.');
      return;
    }

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
      .eq('id', derivedId);

    if (error) {
      setError('Failed to update module');
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push('/admin/modules'); // back to modules list
      }, 1200);
    }
  };

  if (loading) return <p className="neon-loading">Loading module...</p>;
  if (error) return <p className="neon-error">{error}</p>;

  const fields: NeonModuleFormField[] = [
    { key: 'name', label: 'Name', type: 'text', value: name, onChange: (v) => setName(String(v)), required: true },
    { key: 'description', label: 'Description', type: 'text', value: description, onChange: (v) => setDescription(String(v)) },
    { key: 'learningObjectives', label: 'Learning Objectives', type: 'textarea', value: learningObjectives, onChange: (v) => setLearningObjectives(String(v)), rows: 2 },
    { key: 'groupId', label: 'Group ID', type: 'text', value: groupId, onChange: (v) => setGroupId(String(v)), required: true },
    { key: 'estimatedDuration', label: 'Estimated Duration', type: 'text', value: estimatedDuration, onChange: (v) => setEstimatedDuration(String(v)), placeholder: 'Enter duration (e.g. 1h 30m)' },
    { key: 'deliveryFormat', label: 'Delivery Format', type: 'text', value: deliveryFormat, onChange: (v) => setDeliveryFormat(String(v)) },
    { key: 'targetAudience', label: 'Target Audience', type: 'text', value: targetAudience, onChange: (v) => setTargetAudience(String(v)) },
    { key: 'thumbnailUrl', label: 'Thumbnail URL', type: 'text', value: thumbnailUrl, onChange: (v) => setThumbnailUrl(String(v)) },
  ];

  return (
    <>
      <div className="mt-8">
        <NeonModuleForm
          title="Edit Module"
          fields={fields}
          onSubmit={handleSubmit}
          error={error}
          success={success}
        />
      </div>

      {showVersionModal && (
        <div
          className="ui-dialog-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVersionModal(false);
          }}
        >
          <div
            className="ui-dialog-content neon-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="version-title"
            style={{ maxWidth: 420 }}
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
                style={{ minWidth: 140 }}
              >
                Yes, new version
              </button>
              <button
                className="neon-utility-btn neon-btn-edit"
                onClick={() => handleVersionConfirm(false)}
                style={{ minWidth: 140 }}
              >
                No, keep version
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
