import { createClient } from '@supabase/supabase-js'



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseAnonKey?.slice(0, 8) + '...')
