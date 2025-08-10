'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'
import HeroHeader from '@/components/HeroHeader'
import NeonPanel from '@/components/NeonPanel'

import ModuleSelectorWidget from './widgets/ModuleSelectorWidget'
import DocumentSelectorWidget from './widgets/DocumentSelectorWidget'
import BehaviourSelectorWidget from './widgets/BehaviourSelectorWidget'
import AssignmentSelectorWidget from './widgets/AssignmentSelectorWidget'
import { FiArrowLeft, FiArrowRight, FiSave } from 'react-icons/fi'

const steps = [
  { label: 'Modules' },
  { label: 'Documents' },
  { label: 'Behaviours' },
  { label: 'Assignments' },
]

export default function RoleProfileCreate({
  onSubmit,
  onCancel,
}: {
  onSubmit?: (data: any) => void
  onCancel?: () => void
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])
  const [selectedAssignments, setSelectedAssignments] = useState<
    { type: 'user' | 'role' | 'department'; id: string; label: string }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleSave = async () => {
    setSaving(true)
    setError('')

    if (!name.trim()) {
      setError('Profile name is required.')
      setSaving(false)
      return
    }

    const { data: profileData, error: profileError } = await supabase
      .from('role_profiles')
      .insert({ name, description })
      .select()
      .single()

    if (profileError || !profileData) {
      setError('Failed to save role profile.')
      setSaving(false)
      return
    }

    const roleProfileId = profileData.id

    if (selectedModules.length > 0) {
      const { error } = await supabase.from('role_profile_modules').insert(
        selectedModules.map((moduleId) => ({
          role_profile_id: roleProfileId,
          module_id: moduleId,
        }))
      )
      if (error) {
        setError('Failed to link modules.')
        setSaving(false)
        return
      }
    }

    if (selectedDocuments.length > 0) {
      const { error } = await supabase.from('role_profile_documents').insert(
        selectedDocuments.map((documentId) => ({
          role_profile_id: roleProfileId,
          document_id: documentId,
        }))
      )
      if (error) {
        setError('Failed to link documents.')
        setSaving(false)
        return
      }
    }

    if (selectedBehaviours.length > 0) {
      const { error } = await supabase.from('role_profile_behaviours').insert(
        selectedBehaviours.map((behaviourId) => ({
          role_profile_id: roleProfileId,
          behaviour_id: behaviourId,
        }))
      )
      if (error) {
        setError('Failed to link behaviours.')
        setSaving(false)
        return
      }
    }

    if (selectedAssignments.length > 0) {
      const { error } = await supabase.from('user_training_assignments').insert(
        selectedAssignments.map((a) => ({
          role_profile_id: roleProfileId,
          target_type: a.type,
          target_id: a.id,
        }))
      )
      if (error) {
        setError('Failed to create assignments.')
        setSaving(false)
        return
      }
    }

    if (onSubmit) {
      onSubmit({
        id: roleProfileId,
        name,
        description,
        selectedModules,
        selectedDocuments,
        selectedBehaviours,
        selectedAssignments,
      })
    }

    // ✅ Reset form
    setName('')
    setDescription('')
    setSelectedModules([])
    setSelectedDocuments([])
    setSelectedBehaviours([])
    setSelectedAssignments([])
    setStep(0)
    setSaving(false)

    // ✅ Show toast
    toast.success('✅ Role profile saved successfully')
  }

  return (
    <>
      <HeroHeader
        title="Create Role Profile"
        subtitle="Define training modules, documents, behaviours, and assignments for a job role."
      />
      <NeonPanel className="neon-panel-lg">
        <div className="mt-8 pt-6">
          <div className="mb-6">
            <div className="neon-flex items-center gap-2 text-lg font-bold">
              Step {step + 1} of {steps.length}: {steps[step].label}
            </div>
            <div className="mt-2 neon-flex gap-2">
              {steps.map((s, i) => (
                <div
                  key={s.label}
                  className={`h-2 w-8 rounded-full ${i <= step ? 'neon-progress' : 'neon-progress-inactive'}`}
                ></div>
              ))}
            </div>
          </div>

          {step === 0 && (
            <>
              <div className="mb-6">
                <label className="neon-form-title">Profile Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="neon-input w-full"
                  placeholder="Enter profile name"
                />
              </div>
              <div className="mb-6">
                <label className="neon-form-title">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="neon-input w-full"
                  placeholder="Enter description"
                />
              </div>
            </>
          )}

          <div className="mb-6">
            {step === 0 && (
              <ModuleSelectorWidget
                selectedModules={selectedModules}
                onChange={setSelectedModules}
              />
            )}
            {step === 1 && (
              <DocumentSelectorWidget
                selectedDocuments={selectedDocuments}
                onChange={setSelectedDocuments}
              />
            )}
            {step === 2 && (
              <BehaviourSelectorWidget
                selectedBehaviours={selectedBehaviours}
                onChange={setSelectedBehaviours}
              />
            )}
            {step === 3 && (
              <AssignmentSelectorWidget
                selectedAssignments={selectedAssignments}
                onChange={setSelectedAssignments}
              />
            )}
          </div>

          {error && <div className="neon-error mb-4">{error}</div>}

          <div className="neon-flex gap-4 justify-between">
            <button
              className="neon-btn neon-btn-view"
              onClick={step === 0 ? onCancel : handleBack}
              type="button"
              data-tooltip={step === 0 ? 'Cancel' : 'Back'}
            >
              <FiArrowLeft />
            </button>
            {step < steps.length - 1 ? (
              <button
                className="neon-btn neon-btn-edit"
                onClick={handleNext}
                type="button"
                data-tooltip="Next"
                disabled={saving}
              >
                <FiArrowRight />
              </button>
            ) : (
              <button
                className="neon-btn neon-btn-submit"
                onClick={handleSave}
                type="button"
                data-tooltip="Submit Role Profile"
                disabled={saving}
              >
                <FiSave />
              </button>
            )}
          </div>
        </div>
      </NeonPanel>
    </>
  )
}
