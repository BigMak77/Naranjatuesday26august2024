const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://igzucjhzvghlhpqmgolb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnenVjamh6dmdobGhwcW1nb2xiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3MzIxNiwiZXhwIjoyMDY3NzQ5MjE2fQ.jn2RpiNtAvqjsx-sNFFisynpRkfocqfoE6fR_43BI4Q' // 👈 REPLACE with your real service key
)

async function run() {
  const { data, error } = await supabase.storage.from('ssow.wi').list('', {
    limit: 1000,
  })

  if (error) {
    console.error('❌ Error listing files:', error)
    return
  }

  console.log(`📂 Found ${data.length} files:`)
  for (const file of data) {
    console.log('—', file.name)
  }
}

run()
