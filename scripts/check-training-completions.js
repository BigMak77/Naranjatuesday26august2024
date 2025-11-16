require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTrainingCompletions() {
  console.log('🔍 Checking user_training_completions table...\n');

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('user_training_completions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting records:', countError);
    return;
  }

  console.log(`📊 Total completions: ${totalCount}`);

  // Get sample data
  const { data: sample, error: sampleError } = await supabase
    .from('user_training_completions')
    .select('auth_id, item_id, item_type, completed_at, completed_by_role_id')
    .limit(10);

  if (sampleError) {
    console.error('❌ Error fetching sample:', sampleError);
    return;
  }

  console.log('\n📋 Sample records:');
  console.table(sample);

  // Count by role
  const { data: allRecords, error: allError } = await supabase
    .from('user_training_completions')
    .select('completed_by_role_id');

  if (!allError && allRecords) {
    const withRole = allRecords.filter(r => r.completed_by_role_id !== null).length;
    const withoutRole = allRecords.filter(r => r.completed_by_role_id === null).length;

    console.log('\n📈 Role ID distribution:');
    console.log(`  - With role_id: ${withRole}`);
    console.log(`  - Without role_id (NULL): ${withoutRole}`);

    // Get unique role IDs
    const roleIds = [...new Set(allRecords
      .filter(r => r.completed_by_role_id !== null)
      .map(r => r.completed_by_role_id))];

    console.log(`\n🎯 Unique role IDs in completions: ${roleIds.length}`);
    if (roleIds.length > 0) {
      console.log('Role IDs:', roleIds.slice(0, 10));
    }
  }

  // Check user_role_history
  console.log('\n\n🔍 Checking user_role_history table...\n');

  const { data: historyRecords, error: historyError } = await supabase
    .from('user_role_history')
    .select('auth_id, old_role_id, new_role_id')
    .limit(5);

  if (historyError) {
    console.error('❌ Error fetching role history:', historyError);
  } else {
    console.log('📋 Sample role history records:');
    console.table(historyRecords);
  }
}

checkTrainingCompletions().catch(console.error);
