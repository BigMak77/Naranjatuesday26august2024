'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { FiClipboard, FiEdit2, FiUserPlus } from 'react-icons/fi'
import NeonForm from '@/components/NeonForm'
import NeonTable from '@/components/NeonTable'
import NeonPanel from '@/components/NeonPanel'
import NeonIconButton from '@/components/ui/NeonIconButton'

type TurkusRisk = {
  id: string
  title: string
  description: string
  severity: string
  created_at: string
  review_period_months: number
  department_id: string | null
  category_id: string | null
  created_by: string | null
  photo_urls: string[] | null
  control_measures?: string
  persons_at_risk?: string
  injury_risk?: string
}

type Department = {
  id: string
  name: string
}

type User = {
  id: string
  auth_id: string
  email: string
  department_id: string | null
}

export default function RiskAssessmentManager() {
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'assign'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [riskAssessments, setRiskAssessments] = useState<TurkusRisk[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentUsers, setDepartmentUsers] = useState<User[]>([])
  const [assignUserId, setAssignUserId] = useState<string>('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('Medium')
  const [reviewPeriod, setReviewPeriod] = useState(12)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [controlMeasures, setControlMeasures] = useState('')
  const [personsAtRisk, setPersonsAtRisk] = useState('')
  const [injuryRisk, setInjuryRisk] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: risks }, { data: depts }] = await Promise.all([
        supabase.from('turkus_risks').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('id, name').order('name'),
      ])
      setRiskAssessments(risks || [])
      setDepartments(depts || [])
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (mode === 'edit' && selectedId) {
      const selected = riskAssessments.find(r => r.id === selectedId)
      if (selected) {
        setTitle(selected.title)
        setDescription(selected.description)
        setSeverity(selected.severity)
        setReviewPeriod(selected.review_period_months)
        setDepartmentId(selected.department_id)
        setPhotoUrls(selected.photo_urls || [])
        setControlMeasures(selected.control_measures || '')
        setPersonsAtRisk(selected.persons_at_risk || '')
        setInjuryRisk(selected.injury_risk || '')
      }
    }
  }, [mode, selectedId, riskAssessments])

  useEffect(() => {
    if (mode === 'assign' && selectedId) {
      const selected = riskAssessments.find(r => r.id === selectedId)
      if (!selected?.department_id) return

      supabase
        .from('users')
        .select('id, auth_id, email, department_id')
        .eq('department_id', selected.department_id)
        .then(({ data }) => setDepartmentUsers(data || []))
    }
  }, [mode, selectedId, riskAssessments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title,
      description,
      severity,
      review_period_months: reviewPeriod,
      department_id: departmentId,
      photo_urls: photoUrls,
      control_measures: controlMeasures,
      persons_at_risk: personsAtRisk,
      injury_risk: injuryRisk,
      created_by: null,
    }

    const query = mode === 'create'
      ? supabase.from('turkus_risks').insert(payload)
      : supabase.from('turkus_risks').update(payload).eq('id', selectedId)

    const { error } = await query
    if (!error) {
      setMode('list')
      const { data } = await supabase.from('turkus_risks').select('*')
      setRiskAssessments(data || [])
    }
  }

  return (
    <div className="risk-assessment-manager-global">
      <div className="risk-assessment-header-global">
        <h2 className="neon-form-title">
          <FiClipboard /> Risk Assessments
        </h2>
        <NeonIconButton
          variant="add"
          title="Create New"
          icon={<FiEdit2 />}
          onClick={() => { setMode('create'); setSelectedId(null); }}
        />
        <NeonIconButton
          variant="view"
          title="View All"
          icon={<FiClipboard />}
          onClick={() => setMode('list')}
        />
      </div>

      {mode === 'list' && (
        <NeonTable
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Description', accessor: 'description' },
            { header: 'Severity', accessor: 'severity' },
            { header: 'Actions', accessor: 'actions' },
          ]}
          data={riskAssessments.map(risk => ({
            title: risk.title,
            description: risk.description,
            severity: risk.severity,
            actions: (
              <div key={risk.id} className="risk-assessment-actions-global">
                <NeonIconButton
                  variant="edit"
                  title="Amend"
                  icon={<FiEdit2 />}
                  onClick={() => { setMode('edit'); setSelectedId(risk.id) }}
                />
                <NeonIconButton
                  variant="view"
                  title="Assign"
                  icon={<FiUserPlus />}
                  onClick={() => { setMode('assign'); setSelectedId(risk.id) }}
                />
              </div>
            ),
          }))}
        />
      )}

      {(mode === 'create' || mode === 'edit') && (
        <NeonPanel>
          <NeonForm title={mode === 'create' ? 'Create Risk Assessment' : 'Edit Risk Assessment'} onSubmit={handleSubmit}>
            <input className="neon-input" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <textarea className="neon-input" placeholder="Description" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            <select className="neon-input" value={severity} onChange={e => setSeverity(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <input className="neon-input" type="number" placeholder="Review period (months)" value={reviewPeriod} onChange={e => setReviewPeriod(parseInt(e.target.value))} />
            <select className="neon-input" value={departmentId || ''} onChange={e => setDepartmentId(e.target.value)}>
              <option value="">Select department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <textarea className="neon-input" placeholder="Control Measures" value={controlMeasures} onChange={e => setControlMeasures(e.target.value)} />
            <textarea className="neon-input" placeholder="Persons at Risk" value={personsAtRisk} onChange={e => setPersonsAtRisk(e.target.value)} />
            <textarea className="neon-input" placeholder="Injury Risk" value={injuryRisk} onChange={e => setInjuryRisk(e.target.value)} />
            <input className="neon-input" placeholder="Photo URLs (comma separated)" value={photoUrls.join(',')} onChange={e => setPhotoUrls(e.target.value.split(',').map(s => s.trim()))} />
          </NeonForm>
        </NeonPanel>
      )}

      {mode === 'assign' && (
        <NeonPanel>
          <h3 className="neon-form-title">Assign Risk Assessment</h3>
          <p>Assigning: <strong>{riskAssessments.find(r => r.id === selectedId)?.title}</strong></p>
          <select className="neon-input" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
            <option value="">Select user from department</option>
            {departmentUsers.map(user => (
              <option key={user.auth_id} value={user.auth_id}>{user.email}</option>
            ))}
          </select>
          <button
            className="neon-btn neon-btn-assign"
            type="button"
            onClick={async () => {
              if (!selectedId || !assignUserId) return
              const { error } = await supabase.from('turkus_risk_assignments').insert({
                risk_id: selectedId,
                auth_id: assignUserId
              })
              if (!error) setMode('list')
            }}
          >
            Confirm Assignment
          </button>
        </NeonPanel>
      )}
    </div>
  )
}
