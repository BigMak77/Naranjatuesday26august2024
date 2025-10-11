#!/usr/bin/env node

/**
 * Direct API test with debugging - no server needed
 */

const { createClient } = require('@supabase/supabase-js');

async function directAPITest() {
  console.log('🔍 Direct API Test - No Server Required');
  console.log('=' .repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data from our analysis
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const testAuthId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const oldRoleId = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const newRoleId = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    console.log('👤 Test User: John Hernandez');
    console.log(`🔑 Auth ID: ${testAuthId}`);
    console.log(`📋 Old Role: ${oldRoleId}`);
    console.log(`🎯 New Role: ${newRoleId}`);
    console.log();

    // Step 1: Simulate the remove logic
    console.log('🗑️  Step 1: Testing REMOVE logic...');
    
    const { data: oldRoleAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", oldRoleId);

    console.log(`Found ${oldRoleAssignments?.length || 0} old role assignments`);
    
    let simulatedRemoveCount = 0;
    if (oldRoleAssignments && oldRoleAssignments.length > 0) {
      for (const assignment of oldRoleAssignments) {
        console.log(`Checking assignment: ${assignment.item_id} (${assignment.type})`);
        
        // Check if user has this assignment
        const { count: existingCount } = await supabase
          .from("user_assignments")
          .select("*", { count: "exact" })
          .eq("auth_id", testAuthId)
          .eq("item_id", assignment.item_id)
          .eq("item_type", assignment.type);
        
        console.log(`  - User has ${existingCount || 0} matching assignments`);
        
        if (existingCount && existingCount > 0) {
          simulatedRemoveCount += existingCount;
          console.log(`  ✅ Would remove ${existingCount} assignments`);
        } else {
          console.log(`  ⚠️  No matching assignment found`);
        }
      }
    }

    console.log(`📊 Total would remove: ${simulatedRemoveCount}`);
    console.log();

    // Step 2: Test the sync API for adding
    console.log('➕ Step 2: Testing ADD logic (sync API)...');
    
    const { data: newRoleAssignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", newRoleId);

    console.log(`Found ${newRoleAssignments?.length || 0} new role assignments`);

    let simulatedAddCount = 0;
    if (newRoleAssignments && newRoleAssignments.length > 0) {
      for (const assignment of newRoleAssignments) {
        console.log(`Checking new assignment: ${assignment.item_id} (${assignment.type})`);
        
        // Check if user already has this assignment
        const { count: existingCount } = await supabase
          .from("user_assignments")
          .select("*", { count: "exact" })
          .eq("auth_id", testAuthId)
          .eq("item_id", assignment.item_id)
          .eq("item_type", assignment.type);
        
        console.log(`  - User already has ${existingCount || 0} matching assignments`);
        
        if (!existingCount || existingCount === 0) {
          simulatedAddCount += 1;
          console.log(`  ✅ Would add this assignment`);
        } else {
          console.log(`  ⚠️  User already has this assignment`);
        }
      }
    }

    console.log(`📊 Total would add: ${simulatedAddCount}`);
    console.log();

    // Summary
    console.log('📋 SUMMARY:');
    console.log(`Expected Remove: ${simulatedRemoveCount}`);
    console.log(`Expected Add: ${simulatedAddCount}`);
    console.log();

    if (simulatedRemoveCount > 0 && simulatedAddCount > 0) {
      console.log('✅ API SHOULD WORK! The logic is sound.');
      console.log('   If API shows 0/0, there might be a bug in the API code.');
    } else if (simulatedRemoveCount === 0) {
      console.log('⚠️  No assignments to remove - user may not have current role assignments');
    } else if (simulatedAddCount === 0) {
      console.log('⚠️  No assignments to add - user may already have new role assignments');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
directAPITest();
