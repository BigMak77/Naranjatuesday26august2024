import { supabase } from '@/lib/supabase-client'

export type Module = {
  id: string
  name: string
  description: string
  version: number
  group_id: string
  learning_objectives: string
  estimated_duration: string
  delivery_format: string
  target_audience: string
  prerequisites: string[]
  thumbnail_url: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

export async function fetchModules(): Promise<Pick<Module, 'id' | 'name'>[]> {
  const { data, error } = await supabase
    .from('modules')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching modules:', error)
    return []
  }

  return data || []
}

export async function fetchModuleById(id: string): Promise<Module | null> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching module:', error)
    return null
  }

  // Defensive fallback to avoid nulls crashing form
  return {
    ...data,
    prerequisites: data.prerequisites ?? [],
    tags: data.tags ?? [],
    group_id: data.group_id ?? '',
    learning_objectives: data.learning_objectives ?? '',
    estimated_duration: data.estimated_duration ?? '',
    delivery_format: data.delivery_format ?? '',
    target_audience: data.target_audience ?? '',
    thumbnail_url: data.thumbnail_url ?? '',
  }
}

export async function updateModule(id: string, moduleData: Module): Promise<{ error: unknown }> {
  const { error } = await supabase
    .from('modules')
    .update({
      name: moduleData.name,
      description: moduleData.description,
      version: moduleData.version,
      group_id: moduleData.group_id,
      learning_objectives: moduleData.learning_objectives,
      estimated_duration: moduleData.estimated_duration,
      delivery_format: moduleData.delivery_format,
      target_audience: moduleData.target_audience,
      prerequisites: moduleData.prerequisites,
      thumbnail_url: moduleData.thumbnail_url,
      tags: moduleData.tags,
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating module:', error)
  }

  return { error }
}
