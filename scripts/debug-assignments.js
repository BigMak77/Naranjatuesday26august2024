#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function debugAssignments() {
  console.log('🔍 Debug User Assignments Table...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check if user_assignments table exists and get structure
    console.log('\n📋 Table Structure:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_assignments')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Error accessing user_assignments table:', tableError.message);
      return;
    }
    
    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Table exists, sample columns:', Object.keys(tableInfo[0]));
    } else {
      console.log('⚠️  Table exists but is empty');
    }

    // 2. Count total assignments
    const { count, error: countError } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total assignments: ${count}`);
    }

    // 3. Check specific test user
    const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, auth_id, role_id')
      .eq('id', testUserId)
      .single();

    if (userError) {
      console.log(`❌ Test user ${testUserId} not found:`, userError.message);
      return;
    }

    console.log('\n👤 Test User:');
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Name: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   Auth ID: ${testUser.auth_id}`);
    console.log(`   Role ID: ${testUser.role_id}`);

    if (!testUser.auth_id) {
      console.log('❌ PROBLEM: Test user has no auth_id - this breaks assignments!');
      return;
    }

    // 4. Check assignments for test user
    const { data: userAssignments, error: assignError } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    if (assignError) {
      console.log('❌ Error fetching user assignments:', assignError.message);
    } else {
      console.log(`\n📚 Test User Assignments: ${userAssignments?.length || 0}`);
      if (userAssignments && userAssignments.length > 0) {
        userAssignments.forEach((a, i) => {
          console.log(`   ${i + 1}. Training: ${a.training_id}, Reason: ${a.assignment_reason}`);
        });
      }
    }

    // 5. Check role assignments for test roles
    const testRoles = ['534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692'];
    
    for (const roleId of testRoles) {
      const { data: roleAssignments, error: roleError } = await supabase
        .from('role_assignments')
        .select('training_id')
        .eq('role_id', roleId);

      if (!roleError && roleAssignments) {
        console.log(`\n🎯 Role ${roleId} has ${roleAssignments.length} training assignments`);
      }
    }

    // 6. Test the RPC function directly
    console.log('\n🔧 Testing RPC function directly...');
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('update_user_role_assignments', {
        user_id: testUserId,
        old_role_id: testRoles[0],
        new_role_id: testRoles[1]
      });

    if (rpcError) {
      console.log('❌ RPC function failed:', rpcError.message);
    } else {
      console.log('✅ RPC function result:', rpcResult);
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
debugAssignments();
