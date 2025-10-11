#!/usr/bin/env node

/**
 * Quick test to check if the training completion preservation system is ready
 * This will test the database setup and API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quickSystemCheck() {
  console.log('🧪 Quick Training Completion System Check\n');

  try {
    // 1. Check if user_training_completions table exists
    console.log('📋 Step 1: Checking database setup...');
    
    const { data: tableExists, error: tableError } = await supabase
      .from('user_training_completions')
      .select('*', { count: 'exact', head: true });

    if (tableError && tableError.code === '42P01') {
      console.log('❌ user_training_completions table does not exist');
      console.log('\n🔧 SETUP REQUIRED:');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run this SQL to create the table:\n');
      
      const fs = require('fs');
      const path = require('path');
      const sqlPath = path.join(__dirname, '../db/create-user-training-completions-table-safe.sql');
      
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('   ' + '='.repeat(60));
        console.log(sql);
        console.log('   ' + '='.repeat(60));
      }
      
      console.log('\n   4. Then run this test again');
      return;
    }

    if (tableError) {
      console.log('❌ Database connection error:', tableError.message);
      return;
    }

    console.log(`✅ user_training_completions table exists (${tableExists || 0} records)`);

    // 2. Test the API endpoints
    console.log('\n📋 Step 2: Testing API endpoints...');
    
    // Test record completion API
    try {
      const response = await fetch('http://localhost:3000/api/record-training-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // This should fail validation
      });
      
      if (response.status === 400) {
        console.log('✅ Training completion API is responsive');
      } else {
        console.log('⚠️  Training completion API returned unexpected status:', response.status);
      }
    } catch (error) {
      console.log('❌ Training completion API test failed:', error.message);
    }

    // Test role change API
    try {
      const response = await fetch('http://localhost:3000/api/change-user-role-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // This should fail validation
      });
      
      if (response.status === 400) {
        console.log('✅ Role change API is responsive');
      } else {
        console.log('⚠️  Role change API returned unexpected status:', response.status);
      }
    } catch (error) {
      console.log('❌ Role change API test failed:', error.message);
    }

    // 3. Check sample data
    console.log('\n📋 Step 3: Checking sample data...');
    
    const { data: users } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name, role_id')
      .limit(3);

    console.log(`✅ Found ${users?.length || 0} test users`);

    const { data: assignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Found ${assignments || 0} current assignments`);

    const { data: roles } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Found ${roles || 0} roles`);

    console.log('\n🎉 System Check Complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. If database table exists: Test with role changes');
    console.log('   2. If APIs are working: Integration is ready');
    console.log('   3. Replace TrainingMatrix with enhanced version');
    
    console.log('\n🔧 To replace TrainingMatrix component:');
    console.log('   node scripts/update-training-matrix.js');

  } catch (error) {
    console.error('❌ System check failed:', error);
  }
}

// Run the check
if (require.main === module) {
  quickSystemCheck();
}

module.exports = { quickSystemCheck };
