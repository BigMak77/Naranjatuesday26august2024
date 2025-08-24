'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonTable from '@/components/NeonTable'
import Link from 'next/link'
import { FiEye, FiEdit } from 'react-icons/fi'

type RoleProfile = {
  id: number
  name: string
  description: string
  // add other fields as needed
}

export default function RoleProfilesPage() {
  const [profiles, setProfiles] = useState<RoleProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true)
      setError('')
      const { data, error } = await supabase
        .from('role_profiles')
        .select('*')
        .order('name')

      if (error) setError('Failed to load role profiles')
      else setProfiles(data || [])
      setLoading(false)
    }

    fetchProfiles()
  }, [])

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="page-main">
          {error && <div className="neon-message neon-message-error">{error}</div>}
          {loading ? (
            <div className="neon-message neon-message-info">Loading...</div>
          ) : (
            <div className="neon-table-wrapper">
              <NeonTable
                columns={[
                  { header: 'Name', accessor: 'name' },
                  { header: 'Description', accessor: 'description' },
                  {
                    header: 'Actions',
                    accessor: 'id',
                    render: (value, row) => (
                      <div className="neon-panel-actions neon-flex gap-2">
                        <Link href={`/admin/role-profiles/${row.id}`} className="neon-btn neon-btn-view neon-btn-icon" title="View" aria-label="View Role Profile">
                          <FiEye />
                          <span className="neon-btn-label">View</span>
                        </Link>
                        <Link href={`/admin/role-profiles/${row.id}/edit`} className="neon-btn neon-btn-edit neon-btn-icon" title="Edit" aria-label="Edit Role Profile">
                          <FiEdit />
                          <span className="neon-btn-label">Edit</span>
                        </Link>
                      </div>
                    ),
                  },
                ]}
                data={profiles}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
