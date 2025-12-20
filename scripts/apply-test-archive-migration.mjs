import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igzucjhzvghlhpqmgolb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnenVjamh6dmdobGhwcW1nb2xiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE3MzIxNiwiZXhwIjoyMDY3NzQ5MjE2fQ.jn2RpiNtAvqjsx-sNFFisynpRkfocqfoE6fR_43BI4Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('Applying test archive migration...');

  try {
    // Add is_archived column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add is_archived column to question_packs
        ALTER TABLE question_packs
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
      `
    });

    if (alterError && !alterError.message.includes('already exists')) {
      console.error('Error adding column:', alterError);
    } else {
      console.log('✅ Added is_archived column to question_packs');
    }

    // Add comment
    const { error: commentError } = await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN question_packs.is_archived IS 'Whether this question pack is archived';`
    });

    if (commentError) {
      console.error('Error adding comment:', commentError);
    }

    // Create index
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_question_packs_archived ON question_packs(is_archived);`
    });

    if (indexError) {
      console.error('Error creating index:', indexError);
    } else {
      console.log('✅ Created index on is_archived column');
    }

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
