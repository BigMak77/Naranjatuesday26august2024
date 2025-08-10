// lib/getWorkInstructions.ts
import { supabase } from './supabase-client'

export async function getWorkInstructions() {
  const { data, error } = await supabase
    .from('work_instructions')
    .select('id, title, category_id, version_number')
    .order('title')

  if (error) {
    console.error('Error fetching work instructions:', error)
    return []
  }

  return data
}
