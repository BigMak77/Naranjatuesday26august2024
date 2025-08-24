import { supabase } from '../src/lib/supabase-client'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

const csvPath = path.join(__dirname, '../users_rows.csv')
const csvContent = fs.readFileSync(csvPath, 'utf8')
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
})

async function backfillUsers() {
  const { data, error } = await supabase.from('users').insert(records)
  if (error) {
    console.error('Error inserting users:', error)
  } else {
    console.log('Inserted users:', data)
  }
}

backfillUsers()
