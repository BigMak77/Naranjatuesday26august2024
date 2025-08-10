// lib/app/getCategories.ts
import { supabase } from './supabase-client'

export async function getCategories() {
  const { data, error } = await supabase
    .from('document_categories')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data
}
