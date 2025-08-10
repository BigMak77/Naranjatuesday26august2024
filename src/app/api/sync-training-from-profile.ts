// /src/pages/api/sync-training-from-profile.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // needs insert access to user_training_assignments
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { role_profile_id, auth_ids } = req.body

  if (!role_profile_id || !Array.isArray(auth_ids) || auth_ids.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid payload' })
  }

  try {
    // 1. Get modules, documents, behaviours linked to this role profile
    const { data: modules } = await supabase
      .from('role_profile_modules')
      .select('module_id')
      .eq('role_profile_id', role_profile_id)

    const { data: documents } = await supabase
      .from('role_profile_documents')
      .select('document_id')
      .eq('role_profile_id', role_profile_id)

    const { data: behaviours } = await supabase
      .from('role_profile_behaviours')
      .select('behaviour_id')
      .eq('role_profile_id', role_profile_id)

    if (!modules || !documents || !behaviours) {
      return res.status(500).json({ error: 'Failed to fetch profile contents' })
    }

    // 2. Build assignment records
    const newAssignments = []

    for (const auth_id of auth_ids) {
      for (const { module_id } of modules) {
        newAssignments.push({ auth_id, module_id, type: 'module' })
      }
      for (const { document_id } of documents) {
        newAssignments.push({ auth_id, document_id, type: 'document' })
      }
      for (const { behaviour_id } of behaviours) {
        newAssignments.push({ auth_id, behaviour_id, type: 'behaviour' })
      }
    }

    // 3. Get all existing assignments for these users
    const { data: existingAssignments } = await supabase
      .from('user_training_assignments')
      .select('auth_id, module_id, document_id, behaviour_id')

    const existingSet = new Set(
      (existingAssignments || []).map((a) =>
        [a.auth_id, a.module_id || a.document_id || a.behaviour_id].join('|')
      )
    )

    // 4. Filter out duplicates
    const filtered = newAssignments.filter((a) => {
      const key = [a.auth_id, a.module_id || a.document_id || a.behaviour_id].join('|')
      return !existingSet.has(key)
    })

    if (filtered.length > 0) {
      await supabase.from('user_training_assignments').insert(filtered)
    }

    return res.status(200).json({ inserted: filtered.length })
  } catch (err) {
    console.error('Sync error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
