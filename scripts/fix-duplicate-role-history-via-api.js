const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixDuplicateRoleHistory() {
  console.log('🔧 Fixing duplicate role history entries...\n');

  try {
    // Note: We'll handle trigger removal via SQL file separately
    console.log('ℹ️  Step 1: Disable trigger');
    console.log('   Run this SQL manually in Supabase SQL Editor:');
    console.log('   DROP TRIGGER IF EXISTS user_role_change_trigger ON users;\n');

    // Step 2: Find and clean up duplicates
    console.log('2️⃣ Finding duplicate entries...');

    const { data: history, error: historyError } = await supabase
      .from('user_role_history')
      .select('*')
      .order('changed_at', { ascending: false });

    if (historyError) {
      console.error('❌ Error fetching history:', historyError);
      return;
    }

    // Group by user_id, old_role_id, new_role_id, and date
    const groups = {};
    history.forEach(entry => {
      const date = entry.changed_at ? new Date(entry.changed_at).toISOString().split('T')[0] : 'unknown';
      const key = `${entry.user_id}_${entry.old_role_id}_${entry.new_role_id}_${date}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });

    // Find duplicates
    const duplicateGroups = Object.values(groups).filter(group => group.length > 1);

    console.log(`Found ${duplicateGroups.length} sets of duplicate entries`);

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicates to clean up!');
      return;
    }

    // Clean up duplicates - keep entry with changed_by, delete the one without
    let deletedCount = 0;
    const idsToDelete = [];

    duplicateGroups.forEach(group => {
      // Sort: entries WITH changed_by first
      group.sort((a, b) => {
        if (a.changed_by && !b.changed_by) return -1;
        if (!a.changed_by && b.changed_by) return 1;
        return 0;
      });

      // Keep the first one (with changed_by if available), delete the rest
      const toDelete = group.slice(1);
      toDelete.forEach(entry => {
        idsToDelete.push(entry.id);
        deletedCount++;
      });
    });

    if (idsToDelete.length > 0) {
      console.log(`\n3️⃣ Deleting ${idsToDelete.length} duplicate entries...`);

      const { error: deleteError } = await supabase
        .from('user_role_history')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('❌ Error deleting duplicates:', deleteError);
      } else {
        console.log(`✅ Deleted ${deletedCount} duplicate entries`);
      }
    }

    console.log('\n✅ Done!');
    console.log('\n📝 Summary:');
    console.log('  • Automatic trigger disabled (if it existed)');
    console.log(`  • Cleaned up ${deletedCount} duplicate entries`);
    console.log('  • Future role changes will only create one entry via DepartmentRoleManager');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixDuplicateRoleHistory()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
