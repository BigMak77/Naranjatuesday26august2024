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
    <NeonPanel className="p-6">
      <h1 className="text-2xl font-bold mb-4">➕ Add Module</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Same fields as edit, but for adding */}
        <div>
          <label className="block font-medium mb-1">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="border px-3 py-2 rounded w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="border px-3 py-2 rounded w-full" rows={3} />
        </div>
        <div>
          <label className="block font-medium mb-1">Version</label>
          <input type="number" value={version} onChange={e => setVersion(Number(e.target.value))} className="border px-3 py-2 rounded w-full" min={1} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Group ID</label>
          <input type="text" value={groupId} onChange={e => setGroupId(e.target.value)} className="border px-3 py-2 rounded w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Learning Objectives</label>
          <textarea value={learningObjectives} onChange={e => setLearningObjectives(e.target.value)} className="border px-3 py-2 rounded w-full" rows={2} />
        </div>
        <div>
          <label className="block font-medium mb-1">Estimated Duration</label>
          <input type="text" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Delivery Format</label>
          <input type="text" value={deliveryFormat} onChange={e => setDeliveryFormat(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Target Audience</label>
          <input type="text" value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Prerequisites</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={prereqInput} onChange={e => setPrereqInput(e.target.value)} className="border px-3 py-2 rounded w-full" />
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add"
              onClick={() => { if (prereqInput) { setPrerequisites([...prerequisites, prereqInput]); setPrereqInput('') }}}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((p, i) => (
              <span key={i} className="px-2 py-1 rounded text-sm flex items-center gap-1">
                {p}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Remove"
                  onClick={() => setPrerequisites(prerequisites.filter((_, idx) => idx !== i))}
                  className="ml-1"
                />
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Thumbnail URL</label>
          <input type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="border px-3 py-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} className="border px-3 py-2 rounded w-full" />
            <NeonIconButton
              variant="add"
              icon={<FiPlus />}
              title="Add"
              onClick={() => { if (tagInput) { setTags([...tags, tagInput]); setTagInput('') }}}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <span key={i} className="px-2 py-1 rounded text-sm flex items-center gap-1">
                {t}
                <NeonIconButton
                  variant="delete"
                  icon={<FiX />}
                  title="Remove"
                  onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                  className="ml-1"
                />
              </span>
            ))}
          </div>
        </div>
        {error && <p>{error}</p>}
        {success && <p>✅ Module added!</p>}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            className="px-4 py-2 rounded font-semibold shadow transition"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Add Module'}
          </button>
        </div>
      </form>
    </NeonPanel>
  )
}
