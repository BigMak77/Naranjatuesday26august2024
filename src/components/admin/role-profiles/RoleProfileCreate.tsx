'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'
import ContentHeader from '@/components/headersandfooters/ContentHeader'
import NeonPanel from '@/components/NeonPanel'

import DocumentSelectorWidget from './widgets/DocumentSelectorWidget'
import BehaviourSelectorWidget from './widgets/BehaviourSelectorWidget'
import AssignmentSelectorWidget from './widgets/AssignmentSelectorWidget'
import { FiArrowLeft, FiArrowRight, FiSave } from 'react-icons/fi'
import NeonDualListbox from '@/components/ui/NeonDualListbox'

const steps = [
  { label: 'Modules' },
  { label: 'Documents' },
  { label: 'Behaviours' },
  { label: 'Assignments' },
]

type TargetType = 'user' | 'role' | 'department'

export default function RoleProfileCreate({
  onSubmit,
  onCancel,
  profileId,
}: {
  onSubmit?: (data: {
    id: string
    name: string
    description: string
    selectedModules: string[]
    selectedDocuments: string[]
    selectedBehaviours: string[]
    selectedAssignments: { type: TargetType; id: string; label: string }[]
  }) => void
  onCancel?: () => void
  profileId?: string
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])
  const [selectedAssignments, setSelectedAssignments] = useState<
    { type: TargetType; id: string; label: string }[]
  >([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modules, setModules] = useState<{ id: string; label: string }[]>([])

  // ---------- Prefill when editing ----------
  useEffect(() => {
    let cancelled = false
    if (!profileId) return

    const fetchProfile = async () => {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('role_profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle()

        if (profileErr) throw profileErr
        if (!profile) {
          // profile missing — show message but don’t crash
          toast.error('Role profile not found')
          return
        }

        if (cancelled) return
        setName(profile.name || '')
        setDescription(profile.description || '')

        const [mods, docs, behs, targets] = await Promise.all([
          supabase.from('role_profile_modules').select('module_id').eq('role_profile_id', profileId),
          supabase.from('role_profile_documents').select('document_id').eq('role_profile_id', profileId),
          supabase.from('role_profile_behaviours').select('behaviour_id').eq('role_profile_id', profileId),
          supabase.from('role_profile_targets').select('target_type, target_id, label').eq('role_profile_id', profileId),
        ])

        if (cancelled) return
        setSelectedModules((mods.data ?? []).map((m: { module_id: string }) => m.module_id))
        setSelectedDocuments((docs.data ?? []).map((d: { document_id: string }) => d.document_id))
        setSelectedBehaviours((behs.data ?? []).map((b: { behaviour_id: string }) => b.behaviour_id))
        setSelectedAssignments(
          (targets.data ?? []).map((t: { target_type: TargetType; target_id: string; label?: string }) => ({
            type: t.target_type as TargetType,
            id: t.target_id,
            label: t.label ?? '',
          }))
        )
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e)
        console.error('Prefill error:', errMsg)
        toast.error(errMsg || 'Failed to load role profile')
      }
    }

    fetchProfile()
    return () => {
      cancelled = true
    }
  }, [profileId])

  // ---------- Load selectable modules for dual listbox ----------
  useEffect(() => {
    let cancelled = false
    const fetchModules = async () => {
      try {
        const { data, error } = await supabase
          .from('modules')
          .select('id, name')
          .order('name', { ascending: true })
        if (error) throw error
        if (!cancelled && data) {
          setModules(data.map((m: { id: string; name: string }) => ({ id: m.id, label: m.name })))
        }
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : String(e)
        console.error('Load modules error:', errMsg)
        toast.error(errMsg || 'Failed to load modules')
      }
    }
    fetchModules()
    return () => {
      cancelled = true
    }
  }, [])

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  // ---------- Save via one API call ----------
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setError('')

    if (!name.trim()) {
      setError('Profile name is required.')
      setSaving(false)
      return
    }

    try {
      let profileRow;
      if (profileId) {
        // Update existing profile
        const { error: updateErr } = await supabase
          .from('role_profiles')
          .update({ name, description })
          .eq('id', profileId)
        if (updateErr) throw updateErr
        profileRow = { id: profileId }
      } else {
        // Insert new profile
        const { data, error: insertErr } = await supabase
          .from('role_profiles')
          .insert([{ name, description }])
          .select('id')
          .single()
        if (insertErr) throw insertErr
        profileRow = data
      }
      const id = profileRow.id

      // Remove old module/document/behaviour/assignment links if editing
      if (profileId) {
        await Promise.all([
          supabase.from('role_profile_modules').delete().eq('role_profile_id', id),
          supabase.from('role_profile_documents').delete().eq('role_profile_id', id),
          supabase.from('role_profile_behaviours').delete().eq('role_profile_id', id),
          supabase.from('role_profile_targets').delete().eq('role_profile_id', id),
        ])
      }

      // Insert new module links
      if (selectedModules.length > 0) {
        await supabase.from('role_profile_modules').insert(
          selectedModules.map(module_id => ({ role_profile_id: id, module_id }))
        )
      }
      // Insert new document links
      if (selectedDocuments.length > 0) {
        await supabase.from('role_profile_documents').insert(
          selectedDocuments.map(document_id => ({ role_profile_id: id, document_id }))
        )
      }
      // Insert new behaviour links
      if (selectedBehaviours.length > 0) {
        await supabase.from('role_profile_behaviours').insert(
          selectedBehaviours.map(behaviour_id => ({ role_profile_id: id, behaviour_id }))
        )
      }
      // Insert new assignment links
      if (selectedAssignments.length > 0) {
        await supabase.from('role_profile_targets').insert(
          selectedAssignments.map(a => ({ role_profile_id: id, target_type: a.type, target_id: a.id, label: a.label }))
        )
      }

      onSubmit?.({
        id,
        name,
        description,
        selectedModules,
        selectedDocuments,
        selectedBehaviours,
        selectedAssignments,
      })

      if (!profileId) {
        setName('')
        setDescription('')
        setSelectedModules([])
        setSelectedDocuments([])
        setSelectedBehaviours([])
        setSelectedAssignments([])
        setStep(0)
      }

      toast.success('✅ Role profile saved and assignments materialized')
    } catch (e) {
      setError((e as Error)?.message || 'Failed to save role profile')
      toast.error((e as Error)?.message || 'Failed to save role profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ContentHeader title="Create Role Profile" />

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
                />
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
              <div className="mb-6">
                <NeonDualListbox
                  items={modules}
                  selected={selectedModules}
                  onChange={setSelectedModules}
                  titleLeft="Available Modules"
                  titleRight="Selected Modules"
                />
              </div>
            </>
          )}

          <div className="mb-6">
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

          {error && <div className="neon-message neon-message-error mb-4">{error}</div>}

          <div className="neon-flex gap-4 justify-between">
            <button
              className="neon-btn neon-btn-danger neon-btn-icon"
              onClick={step === 0 ? onCancel : handleBack}
              type="button"
              aria-label={step === 0 ? 'Cancel' : 'Back'}
              data-tooltip={step === 0 ? 'Cancel' : 'Back'}
              disabled={saving}
            >
              <FiArrowLeft />
            </button>
            {step < steps.length - 1 ? (
              <button
                className="neon-btn neon-btn-next neon-btn-icon"
                onClick={handleNext}
                type="button"
                aria-label="Next"
                data-tooltip="Next"
                disabled={saving}
              >
                <FiArrowRight />
              </button>
            ) : (
              <button
                className="neon-btn neon-btn-save neon-btn-icon"
                onClick={handleSave}
                type="button"
                aria-label="Submit Role Profile"
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
