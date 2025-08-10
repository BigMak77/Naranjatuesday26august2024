// components/user/UserPermissionsPanel.tsx
"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

interface Permission {
  id: string
  code: string
  label: string
  description: string
}

interface Props {
  authId: string  // Supabase auth.users.id of the user being edited
  currentUserPermissions?: string[] // Optional: permissions of the editor (for access check)
}

export default function UserPermissionsPanel({ authId, currentUserPermissions = [] }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [userPermissionCodes, setUserPermissionCodes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const canEdit = currentUserPermissions.includes('grant_permissions') || currentUserPermissions.includes('manage_users')

  useEffect(() => {
    const fetchData = async () => {
      const { data: allPerms } = await supabase.from('permissions').select('*').order('label')
      const { data: userPerms } = await supabase
        .from('user_permissions')
        .select('permission_id, permission:permissions(code)')
        .eq('auth_id', authId)

      const codes = userPerms?.map((up) => Array.isArray(up.permission) ? (up.permission as any[])[0]?.code : (up.permission as any)?.code) || []
      setPermissions(allPerms || [])
      setUserPermissionCodes(codes)
    }
    fetchData()
  }, [authId])

  const handleToggle = async (code: string, checked: boolean) => {
    if (!canEdit) return
    setSaving(true)

    const perm = permissions.find((p) => p.code === code)
    if (!perm) return

    if (checked) {
      await supabase.from('user_permissions').upsert({ auth_id: authId, permission_id: perm.id })
    } else {
      await supabase
        .from('user_permissions')
        .delete()
        .eq('auth_id', authId)
        .eq('permission_id', perm.id)
    }

    const updated = checked
      ? [...userPermissionCodes, code]
      : userPermissionCodes.filter((c) => c !== code)

    setUserPermissionCodes(updated)
    setSaving(false)
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4 text-orange-600">Additional Permissions</h3>

      <div className="space-y-3">
        {permissions.map((perm) => (
          <label key={perm.code} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={userPermissionCodes.includes(perm.code)}
              disabled={!canEdit || saving}
              onChange={(e) => handleToggle(perm.code, e.target.checked)}
            />
            <span>
              <span className="font-medium text-teal-800">{perm.label}</span>
              <br />
              <span className="text-gray-600">{perm.description}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
