'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import NeonModuleForm, { NeonModuleFormField } from '@/components/NeonModuleForm'
import HeroHeader from '@/components/HeroHeader'

export default function EditModulePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null)

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

  useEffect(() => {
    const fetchModule = async () => {
      const { data, error } = await supabase.from('modules').select('*').eq('id', id).single()
      if (error || !data) {
        setError('Module not found')
        setLoading(false)
        return
      }
      setName(data.name || '')
      setDescription(data.description || '')
      setVersion(data.version || 1)
      setGroupId(data.group_id || '')
      setLearningObjectives(data.learning_objectives || '')
      setEstimatedDuration(data.estimated_duration || '')
      setDeliveryFormat(data.delivery_format || '')
      setTargetAudience(data.target_audience || '')
      setPrerequisites(data.prerequisites || [])
      setThumbnailUrl(data.thumbnail_url || '')
      setLoading(false)
    }
    if (id) fetchModule()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPendingSubmitEvent(e)
    setShowVersionModal(true)
  }

  const handleVersionConfirm = async (isNewVersion: boolean) => {
    setShowVersionModal(false)
    setSaving(true)
    setError(null)
    let newVersion = version
    if (isNewVersion) {
      newVersion = Number(version) + 1
      setVersion(newVersion)
    }
    const { error } = await supabase.from('modules').update({
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
    }).eq('id', id)
    setSaving(false)
    if (error) {
      setError('Failed to update module')
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.push('/admin/modules') // Return to view tab after successful submit
      }, 1200)
    }
  }

  if (loading) return <p className="p-6">Loading module...</p>
  if (error) return <p className="p-6 text-red-600">{error}</p>

  // Prepare fields for NeonModuleForm
  const fields: NeonModuleFormField[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      value: name,
      onChange: setName,
      required: true,
    },
    {
      key: 'description',
      label: 'Description',
      type: 'text',
      value: description,
      onChange: setDescription,
    },
    {
      key: 'learningObjectives',
      label: 'Learning Objectives',
      type: 'textarea',
      value: learningObjectives,
      onChange: setLearningObjectives,
      rows: 2,
    },
    {
      key: 'groupId',
      label: 'Group ID',
      type: 'text',
      value: groupId,
      onChange: setGroupId,
      required: true,
    },
    {
      key: 'estimatedDuration',
      label: 'Estimated Duration',
      type: 'text',
      value: estimatedDuration,
      onChange: setEstimatedDuration,
      placeholder: 'Enter duration (e.g. 1h 30m)',
    },
    {
      key: 'deliveryFormat',
      label: 'Delivery Format',
      type: 'text',
      value: deliveryFormat,
      onChange: setDeliveryFormat,
    },
    {
      key: 'targetAudience',
      label: 'Target Audience',
      type: 'text',
      value: targetAudience,
      onChange: setTargetAudience,
    },
    {
      key: 'thumbnailUrl',
      label: 'Thumbnail URL',
      type: 'text',
      value: thumbnailUrl,
      onChange: setThumbnailUrl,
    },
  ]

  return (
    <>
      <HeroHeader title="Edit Training Module" subtitle="Update module details and content." />
      <div className="mt-8">
        <NeonModuleForm
          title="Edit Module"
          fields={fields}
          onSubmit={handleSubmit}
          saving={saving}
          error={error}
          success={success}
        />
      </div>
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 neon-border rounded-lg p-6 w-full max-w-md text-center">
            <h2 className="text-lg font-bold mb-4 text-neon">Is this a new version of the module?</h2>
            <p className="mb-6 text-gray-200">If yes, the version number will be incremented automatically.</p>
            <div className="flex justify-center gap-4">
              <button className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700" onClick={() => handleVersionConfirm(true)}>Yes, new version</button>
              <button className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800" onClick={() => handleVersionConfirm(false)}>No, keep version</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
