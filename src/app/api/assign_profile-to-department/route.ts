import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      role_profile_id,
      department_id,
      role_id,
      user_auth_ids, // expect this to be an array of UUIDs
    } = body

    // Debug log
    console.log('📨 Incoming assign_profile_to_targets payload:', {
      role_profile_id,
      department_id,
      role_id,
      user_auth_ids,
    })

    // Validate input
    const hasTargets =
      department_id ||
      role_id ||
      (Array.isArray(user_auth_ids) && user_auth_ids.length > 0)

    if (!role_profile_id || !hasTargets) {
      return NextResponse.json(
        {
          error:
            'Missing role_profile_id and at least one of department_id, role_id, or user_auth_ids',
        },
        { status: 400 }
      )
    }

    // Call Supabase SQL function only
    const { data, error } = await supabase.rpc('assign_profile_to_targets', {
      p_role_profile_id: role_profile_id,
      p_department_id: department_id || null,
      p_role_id: role_id || null,
      p_user_auth_ids: user_auth_ids || null,
    })

    if (error) {
      console.error('❌ Supabase RPC error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('❌ Unexpected error in route handler:', err)
    return NextResponse.json(
      { error: 'Unexpected server error', message: err.message },
      { status: 500 }
    )
  }
}
