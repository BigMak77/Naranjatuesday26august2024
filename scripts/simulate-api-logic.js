#!/usr/bin/env node

/**
 * Simulate the exact API logic to find the bug
 */

const { createClient } = require('@supabase/supabase-js');

async function simulateAPI() {
  console.log('🔍 Simulating API Logic Step by Step');
  console.log('=' .repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data
  const user_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const old_role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const new_role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    console.log(`👤 User: ${user_id}`);
    console.log(`📋 Old Role: ${old_role_id}`);
    console.log(`🎯 New Role: ${new_role_id}`);
    console.log();

    // Step 1: Get user's auth_id (same as API)
    console.log('Step 1: Getting user auth_id...');
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("auth_id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      console.log('❌ User not found:', userError);
      return;
    }

    console.log(`✅ User auth_id: ${user.auth_id}`);
    console.log();

    // Step 2: Remove old role assignments (same as API)
    console.log('Step 2: Removing old role assignments...');
    let removedCount = 0;
    
    if (old_role_id) {
      const { data: oldRoleAssignments } = await supabase
        .from("role_assignments")
        .select("item_id, type")
        .eq("role_id", old_role_id);

      console.log(`Found ${oldRoleAssignments?.length || 0} old role assignments`);

      if (oldRoleAssignments && oldRoleAssignments.length > 0) {
        for (const assignment of oldRoleAssignments) {
          console.log(`Checking assignment ${assignment.item_id} (${assignment.type})`);
          
          // Count existing assignments (same as API)
          const { count: existingCount } = await supabase
            .from("user_assignments")
            .select("*", { count: "exact" })
            .eq("auth_id", user.auth_id)
            .eq("item_id", assignment.item_id)
            .eq("item_type", assignment.type);
          
          console.log(`  - Found ${existingCount || 0} existing assignments`);
          
          // Simulate deletion (but don't actually delete)
          if (existingCount && existingCount > 0) {
            console.log(`  ✅ Would remove ${existingCount} assignments`);
            removedCount += existingCount;
          } else {
            console.log(`  ⚠️  No assignments to remove`);
          }
        }
      }
    }

    console.log(`📊 Total removed count: ${removedCount}`);
    console.log();

    // Step 3: Test sync API call (simulate)
    console.log('Step 3: Testing sync API logic...');
    
    const { data: newRoleAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", new_role_id);

    console.log(`Found ${newRoleAssignments?.length || 0} new role assignments`);

    let potentialAddCount = 0;
    if (newRoleAssignments && newRoleAssignments.length > 0) {
      for (const assignment of newRoleAssignments) {
        const { count: existingCount } = await supabase
          .from("user_assignments")
          .select("*", { count: "exact" })
          .eq("auth_id", user.auth_id)
          .eq("item_id", assignment.item_id)
          .eq("item_type", assignment.type);
        
        if (!existingCount || existingCount === 0) {
          potentialAddCount += 1;
          console.log(`  ✅ Would add: ${assignment.item_id} (${assignment.type})`);
        } else {
          console.log(`  ⚠️  Already has: ${assignment.item_id} (${assignment.type})`);
        }
      }
    }

    console.log(`📊 Potential add count: ${potentialAddCount}`);
    console.log();

    // Final result
    console.log('🎯 SIMULATION RESULT:');
    console.log(`   Removed: ${removedCount}`);
    console.log(`   Added: ${potentialAddCount}`);
    console.log();

    if (removedCount > 0 && potentialAddCount > 0) {
      console.log('✅ API LOGIC IS CORRECT!');
      console.log('   The bug must be elsewhere:');
      console.log('   1. Server not running');
      console.log('   2. API endpoint not being called');
      console.log('   3. Console logs not showing');
      console.log('   4. Different data being passed to API');
    } else {
      console.log('❌ Logic issue found');
    }

  } catch (error) {
    console.error('💥 Simulation failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
simulateAPI();
