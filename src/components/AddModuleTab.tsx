import React, { useState } from 'react'
import NeonPanel from '@/components/NeonPanel'
import NeonForm from '@/components/NeonForm'
import NeonIconButton from '@/components/ui/NeonIconButton'
import { FiPlus, FiX } from 'react-icons/fi'

export default function AddModuleTab({ onSuccess }: { onSuccess?: () => void }) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState(1)
  const [groupId, setGroupId] = useState('')
  const [learningObjectives, setLearningObjectives] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [deliveryFormat, setDeliveryFormat] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [prerequisites, setPrerequisites] = useState<string[]>([])
  const [prereqInput, setPrereqInput] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    // TODO: Add supabase insert logic here
    setTimeout(() => {
      setSaving(false)
      setSuccess(true)
      if (onSuccess) onSuccess()
      setTimeout(() => setSuccess(false), 1200)
    }, 1000)
  }

  return (
    <NeonPanel className="add-module-tab-panel">
      <h1 className="add-module-tab-title">
        <FiPlus className="add-module-tab-title-icon" aria-label="Add Module" /> Add Module
      </h1>
      <form onSubmit={handleSubmit} className="add-module-tab-form">
        {/* Same fields as edit, but for adding */}
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="add-module-tab-input" required />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="add-module-tab-input" rows={3} />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Version</label>
          <input type="number" value={version} onChange={e => setVersion(Number(e.target.value))} className="add-module-tab-input" min={1} required />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Group ID</label>
          <input type="text" value={groupId} onChange={e => setGroupId(e.target.value)} className="add-module-tab-input" required />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Learning Objectives</label>
          <textarea value={learningObjectives} onChange={e => setLearningObjectives(e.target.value)} className="add-module-tab-input" rows={2} />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Estimated Duration</label>
          <input type="text" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} className="add-module-tab-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Delivery Format</label>
          <input type="text" value={deliveryFormat} onChange={e => setDeliveryFormat(e.target.value)} className="add-module-tab-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Target Audience</label>
          <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="add-module-tab-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Prerequisites</label>
          <div className="add-module-tab-prereq-row">
            <input type="text" value={prereqInput} onChange={e => setPrereqInput(e.target.value)} className="add-module-tab-input" />
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add"
              onClick={() => { if (prereqInput) { setPrerequisites([...prerequisites, prereqInput]); setPrereqInput('') }}}
            />
          </div>
          <div className="add-module-tab-prereq-list">
            {prerequisites.map((p, i) => (
              <span key={i} className="add-module-tab-prereq">
                {p}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Remove"
                  onClick={() => setPrerequisites(prerequisites.filter((_, idx) => idx !== i))}
                  className="add-module-tab-prereq-remove"
                />
              </span>
            ))}
          </div>
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Thumbnail URL</label>
          <input type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="add-module-tab-input" />
        </div>
        <div className="add-module-tab-field">
          <label className="add-module-tab-label">Tags</label>
          <div className="add-module-tab-tag-row">
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="add-module-tab-input" />
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add"
              onClick={() => { if (tagInput) { setTags([...tags, tagInput]); setTagInput('') }}}
            />
          </div>
          <div className="add-module-tab-tag-list">
            {tags.map((t, i) => (
              <span key={i} className="add-module-tab-tag">
                {t}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Remove"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="add-module-tab-tag-remove"
                />
              </span>
            ))}
          </div>
        </div>
        {error && <p className="add-module-tab-error">{error}</p>}
        {success && <p className="add-module-tab-success"><FiPlus aria-label="Module added" /> Module added!</p>}
        <div className="add-module-tab-actions">
          <button
            type="submit"
            className="add-module-tab-submit-btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Add Module'}
          </button>
        </div>
      </form>
    </NeonPanel>
  )
}
