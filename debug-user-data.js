// Test script to debug user data
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserData() {
  try {
    // Test: Get current user from auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('Auth User:', authUser);
    console.log('Auth Error:', authError);

    if (authUser) {
      // Test: Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, access_level, department_id, first_name, last_name, receive_notifications')
        .eq('auth_id', authUser.id)
        .single();
      
      console.log('User Data:', userData);
      console.log('User Error:', userError);
      
      if (userData?.department_id) {
        // Test: Get department info
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .eq('id', userData.department_id)
          .single();
        
        console.log('Department Data:', deptData);
        console.log('Department Error:', deptError);
      }
    }
  } catch (err) {
    console.error('Test Error:', err);
  }
}

// Uncomment and run this if you want to test
// testUserData();
