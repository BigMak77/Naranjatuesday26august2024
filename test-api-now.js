#!/usr/bin/env node

/**
 * Final API Test - Make actual HTTP call to working endpoint
 */

const { createClient } = require('@supabase/supabase-js');

async function testRealAPI() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test with our known working data
    const user_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
    const old_role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
    const new_role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

    console.log('Testing role assignment API...');
    console.log(`User: ${user_id}`);
    console.log(`${old_role_id} → ${new_role_id}`);

    // Try to make the API call
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user_id,
        old_role_id: old_role_id, 
        new_role_id: new_role_id
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.removed_assignments > 0 && result.added_assignments > 0) {
        console.log('🎉 SUCCESS! API is working!');
      } else {
        console.log('⚠️ API returned 0 counts - still investigating');
      }
    } else {
      const error = await response.text();
      console.log('API Error:', error);
      console.log('Make sure server is running: npm run dev');
    }

  } catch (error) {
    console.log('Connection Error:', error.message);
    console.log('Server might not be running');
  }
}

require('dotenv').config({ path: '.env.local' });
testRealAPI();
