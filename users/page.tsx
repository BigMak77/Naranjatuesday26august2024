"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import UserManagementPanel from '@/components/user/UserManagementPanel'

export default function UsersListPage() {
  return <UserManagementPanel />
}
