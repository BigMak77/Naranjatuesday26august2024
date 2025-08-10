/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'
import { syncRoleProfileAssignments } from '@/lib/syncRoleProfileAssignments'
import { FiSave, FiArrowLeft, FiUserPlus, FiAlertCircle } from 'react-icons/fi'
import HeroHeader from '@/components/HeroHeader'
import NeonPanel from '@/components/NeonPanel'
import ModuleSelectorWidget from '@/components/admin/role-profiles/widgets/ModuleSelectorWidget'
import DocumentSelectorWidget from '@/components/admin/role-profiles/widgets/DocumentSelectorWidget'
import BehaviourSelectorWidget from '@/components/admin/role-profiles/widgets/BehaviourSelectorWidget'
import AssignmentSelectorWidget from '@/components/admin/role-profiles/widgets/AssignmentSelectorWidget'

export default function RoleProfileBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileId = searchParams.get('id')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([])
  const [selectedAssignments, setSelectedAssignments] = useState<{
    type: 'user' | 'role' | 'department';
    id: string;
    label: string;
  }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPostSavePrompt, setShowPostSavePrompt] = useState(false)
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profileId) return
    const fetchProfile = async () => {
      const { data: profile, error: profileError } = await supabase
        .from('role_profiles')
        .select('id, name, description')
        .eq('id', profileId)
        .single()

      if (profileError || !profile) {
        setError('Failed to load role profile.')
        return
      }

      setName(profile.name)
      setDescription(profile.description)

      const [modules, documents, behaviours, assignments] = await Promise.all([
        supabase.from('role_profile_modules').select('module_id').eq('role_profile_id', profileId),
        supabase.from('role_profile_documents').select('document_id').eq('role_profile_id', profileId),
        supabase.from('role_profile_behaviours').select('behaviour_id').eq('role_profile_id', profileId),
        supabase.from('role_profile_assignments').select('*').eq('role_profile_id', profileId),
      ])

      setSelectedModules(modules.data?.map((m) => m.module_id) || [])
      setSelectedDocuments(documents.data?.map((d) => d.document_id) || [])
      setSelectedBehaviours(behaviours.data?.map((b) => b.behaviour_id) || [])
      setSelectedAssignments(
        assignments.data?.map((a) => {
          const type = a.user_id ? 'user' : a.role_id ? 'role' : 'department'
          const id = a.user_id || a.role_id || a.department_id
          return { type, id, label: '' }
        }) || []
      )
    }
    fetchProfile()
  }, [profileId])

  const handleSubmit = async () => {
    setSaving(true)
    setError('')

    let id = profileId
    if (profileId) {
      const { error: updateError } = await supabase
        .from('role_profiles')
        .update({ name, description })
        .eq('id', profileId)

      if (updateError) {
        setError('Failed to update role profile.')
        setSaving(false)
        return
      }

      await Promise.all([
        supabase.from('role_profile_modules').delete().eq('role_profile_id', profileId),
        supabase.from('role_profile_documents').delete().eq('role_profile_id', profileId),
        supabase.from('role_profile_behaviours').delete().eq('role_profile_id', profileId),
        supabase.from('role_profile_assignments').delete().eq('role_profile_id', profileId),
      ])
    } else {
      const { data: profile, error: insertError } = await supabase
        .from('role_profiles')
        .insert({ name, description })
        .select()
        .single()

      if (insertError || !profile) {
        setError('Failed to save role profile.')
        setSaving(false)
        return
      }

      id = profile.id
    }

    await supabase.from('role_profile_modules').insert(
      selectedModules.map((moduleId) => ({ role_profile_id: id, module_id: moduleId }))
    )

    await supabase.from('role_profile_documents').insert(
      selectedDocuments.map((documentId) => ({ role_profile_id: id, document_id: documentId }))
    )

    await supabase.from('role_profile_behaviours').insert(
      selectedBehaviours.map((behaviourId) => ({ role_profile_id: id, behaviour_id: behaviourId }))
    )

    await supabase.from('role_profile_assignments').insert(
      selectedAssignments.map((a) => ({
        role_profile_id: id,
        user_id: a.type === 'user' ? a.id : null,
        role_id: a.type === 'role' ? a.id : null,
        department_id: a.type === 'department' ? a.id : null,
      }))
    )

    // 🔁 Auto-sync training for assigned users, roles, departments
    const userIds = new Set<string>()

    for (const a of selectedAssignments) {
      if (a.type === 'user') {
        userIds.add(a.id)
      } else if (a.type === 'role') {
        const { data } = await supabase.from('users').select('auth_id').eq('role_id', a.id)
        data?.forEach((u) => userIds.add(u.auth_id))
      } else if (a.type === 'department') {
        const { data } = await supabase.from('users').select('auth_id').eq('department_id', a.id)
        data?.forEach((u) => userIds.add(u.auth_id))
      }
    }

    await Promise.all([...userIds].map((authId) => syncRoleProfileAssignments(authId)))

    setSavedProfileId(id)
    setSaving(false)
    setShowPostSavePrompt(true)
  }

  return (
    <>
      <HeroHeader title={profileId ? 'Edit Role Profile' : 'Create Role Profile'} />
      <NeonPanel className="neon-panel-lg">
        {error && (
          <p className="text-red-600 text-base font-semibold mb-2 flex items-center gap-2">
            <FiAlertCircle className="inline-block" /> {error}
          </p>
        )}
        <div className="space-y-2">
          <label className="neon-label">Profile Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="neon-input w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="neon-label">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="neon-input w-full"
          />
        </div>
        <div>
          <h2 className="neon-section-title"><FiUserPlus /> Add Modules</h2>
          <ModuleSelectorWidget selectedModules={selectedModules} onChange={setSelectedModules} />
        </div>
        <div>
          <h2 className="neon-section-title"><FiUserPlus /> Add Documents</h2>
          <DocumentSelectorWidget selectedDocuments={selectedDocuments} onChange={setSelectedDocuments} />
        </div>
        <div>
          <h2 className="neon-section-title"><FiUserPlus /> Add Behaviours</h2>
          <BehaviourSelectorWidget selectedBehaviours={selectedBehaviours} onChange={setSelectedBehaviours} />
        </div>
        <div>
          <h2 className="neon-section-title"><FiUserPlus /> Assign Profile</h2>
          <AssignmentSelectorWidget selectedAssignments={selectedAssignments} onChange={setSelectedAssignments} />
        </div>
        <div className="pt-4 neon-flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="neon-btn neon-btn-edit"
            data-tooltip={saving ? 'Saving...' : profileId ? 'Update Role Profile' : 'Save Role Profile'}
          >
            <FiSave />
          </button>
          <button
            className="neon-btn neon-btn-view"
            data-tooltip="Back to Profiles"
            onClick={() => router.push('/admin/role-profiles')}
            type="button"
          >
            <FiArrowLeft />
          </button>
        </div>
        {showPostSavePrompt && savedProfileId && (
          <div className="fixed inset-0 neon-modal-overlay flex items-center justify-center z-50">
            <div className="neon-modal p-6 max-w-sm w-full text-center">
              <h2 className="neon-modal-title mb-2 flex items-center gap-2"><FiSave /> Role Profile Saved</h2>
              <p className="mb-4">Would you like to assign this profile now?</p>
              <div className="flex justify-center gap-4">
                <button
                  className="neon-btn neon-btn-edit"
                  data-tooltip="Assign Now"
                  onClick={() => router.push(`/admin/role-profiles/assign?id=${savedProfileId}`)}
                >
                  <FiUserPlus />
                </button>
                <button
                  className="neon-btn neon-btn-view"
                  data-tooltip="Maybe Later"
                  onClick={() => router.push('/admin/role-profiles')}
                >
                  <FiArrowLeft />
                </button>
              </div>
            </div>
          </div>
        )}
      </NeonPanel>
    </>
  )
}
