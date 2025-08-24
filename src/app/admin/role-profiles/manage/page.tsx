"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'
import { FiEye, FiEdit } from 'react-icons/fi'

const ManageRoleProfilesPage = () => {
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string; description?: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('role_profiles').select('id, name, description')
      if (error) {
        setError(error.message)
        setProfiles([])
      } else {
        setProfiles(data || [])
        setError(null)
      }
      setLoading(false)
    }
    fetchProfiles()
  }, [])

  return (
    <NeonPanel className="neon-panel-lg">
      <h1 className="neon-section-title mb-4">Manage Role Profiles</h1>
      <p className="mb-6">View, edit, and organize your role profiles.</p>
      {loading && <div className="neon-message neon-message-info">Loading...</div>}
      {error && <div className="neon-message neon-message-error">Error: {error}</div>}
      {!loading && !error && (
        <div className="neon-table-wrapper">
          <table className="neon-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.name}</td>
                  <td>{profile.description || '-'}</td>
                  <td>
                    <a href={`/admin/role-profiles/${profile.id}`} className="neon-btn neon-btn-view neon-btn-icon" title="View" aria-label="View Role Profile">
                      <FiEye />
                      <span className="neon-btn-label">View</span>
                    </a>
                    <a href={`/admin/role-profiles/${profile.id}/edit`} className="neon-btn neon-btn-edit neon-btn-icon" title="Edit" aria-label="Edit Role Profile">
                      <FiEdit />
                      <span className="neon-btn-label">Edit</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </NeonPanel>
  )
}

export default ManageRoleProfilesPage