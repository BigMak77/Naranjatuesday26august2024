"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useUser } from '@/lib/useUser'
import { Dialog } from '@headlessui/react'
import { FiAlertCircle, FiEdit, FiEye, FiX, FiCheck } from 'react-icons/fi'
import NeonTable from '@/components/NeonTable';
import NeonIconButton from '../ui/NeonIconButton';

export default function DepartmentIssuesWidget() {
  const { user } = useUser()
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewIssue, setViewIssue] = useState<any | null>(null)
  const [assignIssue, setAssignIssue] = useState<any | null>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchIssues = async () => {
      setLoading(true)
      setError(null)
      // Fetch issues for the user's department(s)
      const { data, error } = await supabase
        .from('issues')
        .select('id, title, status, priority, created_at, department:departments(name)')
        .eq('department_id', user.department_id)
        .order('created_at', { ascending: false })
      if (error) setError('Failed to load issues.')
      setIssues(data || [])
      setLoading(false)
    }
    fetchIssues()

    // Fetch departments for assign/reassign
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name')
      if (!error) setDepartments(data || [])
    }
    fetchDepartments()

    // Fetch users in the same department for assignment
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('id, first_name, last_name').eq('department_id', user.department_id)
      if (!error) setUsers(data || [])
    }
    fetchUsers()
  }, [user])

  // Handler for assigning/reassigning
  const handleAssign = async (issueId: string, departmentId: string) => {
    setAssignLoading(true)
    setAssignError(null)
    const { error } = await supabase.from('issues').update({ department_id: departmentId }).eq('id', issueId)
    if (error) setAssignError('Failed to update department.')
    else {
      setIssues(issues => issues.filter(i => i.id !== issueId)) // Remove reassigned issue from list
      setAssignIssue(null)
    }
    setAssignLoading(false)
  }

  // Handler for assigning to user in same department
  const handleAssignUser = async (issueId: string, userId: string) => {
    setAssignLoading(true)
    setAssignError(null)
    const { error } = await supabase.from('issues').update({ assigned_to: userId }).eq('id', issueId)
    if (error) setAssignError('Failed to assign user.')
    else {
      setIssues(issues => issues.map(i => i.id === issueId ? { ...i, assigned_to: userId } : i))
      setAssignIssue(null)
    }
    setAssignLoading(false)
  }

  if (!user) return null

  return (
    <>
      <h2 className="neon-section-title mb-4 flex items-center gap-2">
        <FiAlertCircle /> Department Issues
      </h2>
      {loading ? (
        <p className="neon-info">Loading...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : issues.length === 0 ? (
        <p className="neon-info">No issues found for your department.</p>
      ) : (
        <NeonTable
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Priority', accessor: 'priority' },
            { header: 'Status', accessor: 'status' },
            { header: 'Created', accessor: 'created' },
            { header: 'Department', accessor: 'department' },
            { header: 'Actions', accessor: 'actions' },
          ]}
          data={issues.map((issue) => ({
            title: issue.title,
            priority: issue.priority,
            status: issue.status,
            created: issue.created_at ? new Date(issue.created_at).toLocaleDateString('en-GB') : '—',
            department: issue.department?.name || '—',
            actions: (
              <div className="flex gap-2">
                <NeonIconButton
                  as="button"
                  variant="view"
                  icon={<FiEye />}
                  title="View Issue"
                  onClick={() => setViewIssue(issue)}
                />
                <NeonIconButton
                  as="button"
                  variant="edit"
                  icon={<FiEdit />}
                  title="Edit Issue"
                  onClick={() => {/* TODO: implement edit logic or navigation */}}
                />
                <NeonIconButton
                  as="button"
                  variant="archive"
                  icon={<FiCheck />}
                  title="Mark as Resolved"
                  onClick={() => {/* TODO: implement resolve logic */}}
                />
              </div>
            ),
          }))}
        />
      )}
      {/* View Issue Modal */}
      {viewIssue && (
        <Dialog open={!!viewIssue} onClose={() => setViewIssue(null)} className="neon-modal-overlay">
          <div className="neon-modal-bg" aria-hidden="true" />
          <div className="neon-modal p-6 max-w-md w-full">
            <h3 className="neon-modal-title mb-2">Issue Details</h3>
            <p><b>Title:</b> {viewIssue.title}</p>
            <p><b>Priority:</b> {viewIssue.priority}</p>
            <p><b>Status:</b> {viewIssue.status}</p>
            <p><b>Created:</b> {viewIssue.created_at ? new Date(viewIssue.created_at).toLocaleDateString('en-GB') : ''}</p>
            <p><b>Department:</b> {viewIssue.department?.name || ''}</p>
            <div className="flex justify-end gap-2">
              <NeonIconButton variant="view" icon={<FiX />} title="Close" onClick={() => setViewIssue(null)} />
            </div>
          </div>
        </Dialog>
      )}
      {/* Assign/Reassign Modal */}
      {assignIssue && (
        <Dialog open={!!assignIssue} onClose={() => setAssignIssue(null)} className="neon-modal-overlay">
          <div className="neon-modal-bg" aria-hidden="true" />
          <div className="neon-modal p-6 max-w-md w-full">
            <h3 className="neon-modal-title mb-2 flex items-center gap-2">
              <FiAlertCircle />
              {assignIssue.mode === 'assign' ? 'Assign User' : 'Reassign Department'}
            </h3>
            {assignIssue.mode === 'assign' ? (
              <>
                <select
                  className="neon-input mb-4"
                  value={assignIssue.issue.assigned_to || ''}
                  onChange={e => setAssignIssue((prev: any) => ({ ...prev, issue: { ...prev.issue, assigned_to: e.target.value } }))}
                >
                  <option value="">Select User</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </>
            ) : (
              <select
                className="neon-input mb-4"
                value={assignIssue.issue.department?.id || ''}
                onChange={e => setAssignIssue((prev: any) => ({ ...prev, issue: { ...prev.issue, department: departments.find(d => d.id === e.target.value) } }))}
              >
                <option value="">Select Department</option>
                {departments
                  .filter(d => d.id !== user.department_id)
                  .map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
              </select>
            )}
            {assignError && <p className="neon-error text-sm mb-2">{assignError}</p>}
            <div className="neon-flex gap-2 justify-end">
              <NeonIconButton variant="cancel" icon={<FiX />} title="Cancel" onClick={() => setAssignIssue(null)} disabled={assignLoading} />
              <NeonIconButton
                variant="save"
                icon={<FiCheck />}
                title="Save"
                disabled={assignLoading || (assignIssue.mode === 'assign' ? !assignIssue.issue.assigned_to : !assignIssue.issue.department?.id)}
                onClick={() => assignIssue.mode === 'assign' ? handleAssignUser(assignIssue.issue.id, assignIssue.issue.assigned_to) : handleAssign(assignIssue.issue.id, assignIssue.issue.department.id)}
              >
                {assignLoading ? 'Saving...' : 'Save'}
              </NeonIconButton>
            </div>
          </div>
        </Dialog>
      )}
    </>
  )
}
