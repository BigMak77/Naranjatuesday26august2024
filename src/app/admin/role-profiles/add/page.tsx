'use client'

import HeroHeader from '@/components/HeroHeader'
import RoleProfileCreate from '@/components/admin/role-profiles/RoleProfileCreate'

export default function RoleProfilesPage() {
  return (
    <>
      <HeroHeader title="Add Role Profile" subtitle="Create a new role profile for your organization." />
      <RoleProfileCreate />
    </>
  )
}