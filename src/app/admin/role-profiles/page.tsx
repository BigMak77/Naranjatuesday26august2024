'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonTable from '@/components/NeonTable'
import HeroHeader from '@/components/HeroHeader'
import Link from 'next/link'

export default function RoleProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([])
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
    <div className="role-profiles-page">
      <HeroHeader
        title="Role Profiles"
        subtitle="View and manage the training, documents, and behaviours linked to each role."
      />

      <div className="content-container">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {loading ? (
          <div className="text-white">Loading...</div>
        ) : (
          <NeonTable
            columns={[
              { header: 'Name', accessor: 'name' },
              { header: 'Description', accessor: 'description' },
              {
                header: 'Actions',
                accessor: 'id',
                render: (id: string) => (
                  <div className="flex gap-2">
                    <Link href={`/admin/role-profiles/${id}`} className="btn-view btn-small">
                      View
                    </Link>
                    <Link href={`/admin/role-profiles/${id}/edit`} className="btn-edit btn-small">
                      Edit
                    </Link>
                  </div>
                ),
              },
            ]}
            data={profiles}
          />
        )}
      </div>
    </div>
  )
}
