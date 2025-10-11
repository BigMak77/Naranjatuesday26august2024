#!/usr/bin/env node

/**
 * Quick API Test - Using the ACTUAL table structure
 */

const { createClient } = require('@supabase/supabase-js');

async function quickAPITest() {
  console.log('🧪 Testing API with ACTUAL table structure...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test user from your data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';

  try {
    // 1. Check test user exists and has auth_id
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`👤 Test User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`🔑 Auth ID: ${testUser.auth_id}`);
    console.log(`📋 Current Role: ${testUser.role_id}`);

    // 2. Check current assignments for this user
    const { data: currentAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    console.log(`📊 Current Assignments: ${currentAssignments?.length || 0}`);
    if (currentAssignments?.length > 0) {
      console.log('   Sample assignments:');
      currentAssignments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.item_type}: ${a.item_id}`);
      });
    }

    // 3. Check if test roles have role_assignments
    const testRoles = ['534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692'];
    
    for (const roleId of testRoles) {
      const { data: roleAssignments } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('role_id', roleId);

      console.log(`🎯 Role ${roleId}: ${roleAssignments?.length || 0} assignments`);
      if (roleAssignments?.length > 0) {
        console.log('   Sample role assignments:');
        roleAssignments.slice(0, 2).forEach(ra => {
          console.log(`   - Training: ${ra.training_id || ra.module_id || ra.document_id || 'unknown'}`);
        });
      }
    }

    // 4. Try the API call with your actual user
    console.log('\n🚀 Testing API call...');
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        new_role_id: '040cfbe5-26e1-48c0-8bbc-b8653a79a692',
        old_role_id: testUser.role_id
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
quickAPITest();
