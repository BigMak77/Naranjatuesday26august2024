import React, { useState } from 'react'
import NeonIconButton from '@/components/ui/NeonIconButton'
import { FiPlus, FiX } from 'react-icons/fi'
import { supabase } from '@/lib/supabase-client';
import NeonForm from '@/components/NeonForm';

export default function AddModuleTab({ onSuccess }: { onSuccess?: () => void }) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState(1)
  const [learningObjectives, setLearningObjectives] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [deliveryFormat, setDeliveryFormat] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  // Removed unused 'saving' state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      // Only export fields present in the add form
      const payload = {
        name: name, // required, never null
        description: description || null,
        version: version, // required, never null
        learning_objectives: learningObjectives || null,
        estimated_duration: estimatedDuration || null,
        delivery_format: deliveryFormat || null,
        tags: tags.length > 0 ? tags : null,
      };
      const { error } = await supabase.from('modules').insert([payload]);
      if (error) throw error;
      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 1200);
      // Optionally reset form fields here
      setDescription('');
      setVersion(1);
      setName('');
      setLearningObjectives('');
      setEstimatedDuration('');
      setDeliveryFormat('');
      setTags([]);
      setTagInput('');
    } catch (err) {
      setError((err instanceof Error ? err.message : 'Failed to add module.'));
    }
  };

  return (
    <>
      <h1 className="add-module-tab-title">
        {/* Removed Add button from form header */}
      </h1>
      <NeonForm title="Add Module" onSubmit={handleSubmit}>
        {/* Same fields as edit, but for adding */}
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="add-module-tab-input neon-input" required />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="add-module-tab-input neon-input" rows={3} />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Version</label>
          <input type="number" value={version} onChange={e => setVersion(Number(e.target.value))} className="add-module-tab-input neon-input" min={1} required />
        </div>
       
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Learning Objectives</label>
          <textarea value={learningObjectives} onChange={e => setLearningObjectives(e.target.value)} className="add-module-tab-input neon-input" rows={2} />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Estimated Duration</label>
          <input type="text" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} className="add-module-tab-input neon-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Delivery Format</label>
          <input type="text" value={deliveryFormat} onChange={e => setDeliveryFormat(e.target.value)} className="add-module-tab-input neon-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Tags</label>
          <div className="add-module-tab-tag-row">
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="add-module-tab-input neon-input" />
         
          </div>
          <div className="add-module-tab-tag-list">
            {tags.map((t, i) => (
              <span key={i} className="add-module-tab-tag">
                {t}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX color="white" />}
                  title="Remove"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="add-module-tab-tag-remove"
                />
              </span>
            ))}
          </div>
        </div>
        {error && <p className="add-module-tab-error">{error}</p>}
        {success && <p className="add-module-tab-success"><NeonIconButton variant="add" icon={<FiPlus color="white" />} title="Added" /> Module added!</p>}
        <div className="add-module-tab-actions">
        </div>
      </NeonForm>
    </>
  );
}
