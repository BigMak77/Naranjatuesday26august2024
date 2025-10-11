#!/usr/bin/env node

/**
 * Setup role assignments for testing - using your actual table structure
 */

const { createClient } = require('@supabase/supabase-js');

async function setupRoleAssignments() {
  console.log('🔧 Setting up role assignments for testing...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testRoles = [
    '534b9124-d4c5-4569-ab9b-46d3f37b986c', // Role 1
    '040cfbe5-26e1-48c0-8bbc-b8653a79a692'  // Role 2
  ];

  try {
    // 1. Get some sample training items from user_assignments
    const { data: sampleAssignments } = await supabase
      .from('user_assignments')
      .select('item_id, item_type')
      .limit(10);

    if (!sampleAssignments || sampleAssignments.length === 0) {
      console.log('❌ No training items found in user_assignments');
      return;
    }

    console.log(`📋 Found ${sampleAssignments.length} sample training items`);

    // 2. Check current role assignments
    for (const roleId of testRoles) {
      const { data: existing } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('role_id', roleId);

      console.log(`🎯 Role ${roleId}: ${existing?.length || 0} existing assignments`);
    }

    // 3. Add some training assignments to each test role
    for (let i = 0; i < testRoles.length; i++) {
      const roleId = testRoles[i];
      
      // Take different items for each role
      const itemsForRole = sampleAssignments.slice(i * 3, (i + 1) * 3);
      
      for (const item of itemsForRole) {
        // Check what columns role_assignments actually has
        // This might need adjustment based on your actual table structure
        const assignmentData = {
          role_id: roleId,
          training_id: item.item_id, // Assuming training_id maps to item_id
          type: item.item_type
        };

        try {
          const { error } = await supabase
            .from('role_assignments')
            .insert(assignmentData);

          if (error) {
            console.log(`⚠️  Failed to add assignment for role ${roleId}:`, error.message);
          } else {
            console.log(`✅ Added ${item.item_type} assignment to role ${roleId}`);
          }
        } catch (insertError) {
          console.log(`⚠️  Insert error for role ${roleId}:`, insertError.message);
        }
      }
    }

    // 4. Verify the setup
    console.log('\n🔍 Verifying setup...');
    for (const roleId of testRoles) {
      const { data: roleAssignments } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('role_id', roleId);

      console.log(`🎯 Role ${roleId}: ${roleAssignments?.length || 0} total assignments`);
    }

    console.log('\n✅ Role assignment setup complete!');
    console.log('Now try your API test again.');

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
setupRoleAssignments();
