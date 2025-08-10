import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' }) // Load your Supabase credentials

import { createClient } from '@supabase/supabase-js'

// Supabase environment variables
const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function backfillAuthUsers() {
  console.log("🔍 Fetching users without auth_id...")

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, department_id, role_id, access_level')
    .is('auth_id', null)

  if (error) {
    console.error("❌ Error fetching users:", error.message)
    return
  }

  if (!users || users.length === 0) {
    console.log("✅ All users have auth_id. Nothing to do.")
    return
  }

  for (const user of users) {
    const password = 'Temp1234!' // Default password — update logic as needed

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        department_id: user.department_id,
        role_id: user.role_id,
        access_level: user.access_level,
      },
    })

    if (authError || !authData?.user?.id) {
      console.error(`❌ Failed to create auth user for ${user.email}:`, authError?.message)
      continue
    }

    const auth_id = authData.user.id

    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_id })
      .eq('id', user.id) // This is correct: 'id' is the PK in your users table, but use 'auth_id' everywhere else for joins/queries

    if (updateError) {
      console.error(`Could not update user ${user.email} with auth_id:`, updateError.message)
    } else {
      console.log(`✅ User ${user.email} linked to auth_id ${auth_id}`)
    }
  }

  console.log("🎯 Backfill complete.")
}

backfillAuthUsers()
