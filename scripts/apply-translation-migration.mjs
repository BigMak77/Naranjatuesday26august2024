import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igzucjhzvghlhpqmgolb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnenVjamh6dmdobGhwcW1nb2xiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3MzIxNiwiZXhwIjoyMDY3NzQ5MjE2fQ.jn2RpiNtAvqjsx-sNFFisynpRkfocqfoE6fR_43BI4Q';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

console.log('Applying translation and time columns migration to training_logs...');

const sql = `
-- Add translation-related columns and time tracking to training_logs table

-- Add translator signature column
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translator_signature TEXT;

-- Add translation required flag
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translation_required BOOLEAN DEFAULT FALSE;

-- Add translation language
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translation_language TEXT;

-- Add translator name
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS translator_name TEXT;

-- Add time column for recording the time of training
ALTER TABLE training_logs
ADD COLUMN IF NOT EXISTS time TIME;
`;

try {
  // Execute the SQL using a direct query
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  if (error) {
    throw error;
  }

  console.log('✅ Migration completed successfully!');
  console.log('   - Added translator_signature column');
  console.log('   - Added translation_required column');
  console.log('   - Added translation_language column');
  console.log('   - Added translator_name column');
  console.log('   - Added time column');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\nTrying alternative method...');

  // If exec_sql doesn't work, try inserting directly
  try {
    // Test if columns exist by trying to select them
    const { error: testError } = await supabase
      .from('training_logs')
      .select('translator_signature, translation_required, translation_language, translator_name, time')
      .limit(1);

    if (testError) {
      console.log('⚠️  Columns may not exist yet. Please run the migration manually in the Supabase SQL editor:');
      console.log('\n' + sql);
    } else {
      console.log('✅ Columns already exist!');
    }
  } catch (e) {
    console.error('Could not verify columns:', e.message);
  }
}
