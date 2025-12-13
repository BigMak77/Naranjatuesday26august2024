// Debug script to test user role/department updates
// This script will help identify if the issue is with the database updates or the UI refresh

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserUpdates() {
  try {
    console.log('=== DEBUGGING USER UPDATES ===\n');
    
    // 1. Get all users with their current department/role assignments
    console.log('1. Current user data:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        employee_number,
        department_id,
        role_id,
        departments:department_id (name),
        roles:role_id (title)
      `)
      .not('employee_number', 'is', null)
      .order('first_name');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    users.forEach(user => {
      const deptName = user.departments ? user.departments.name : 'NO DEPT';
      const roleName = user.roles ? user.roles.title : 'NO ROLE';
      console.log(`  ${user.first_name} ${user.last_name} (${user.employee_number}) -> ${deptName} / ${roleName}`);
    });
    
    console.log(`\nTotal active users: ${users.length}\n`);
    
    // 2. Check for users without departments or roles
    const usersWithoutDept = users.filter(u => !u.department_id);
    const usersWithoutRole = users.filter(u => !u.role_id);
    
    console.log('2. Users needing assignment:');
    console.log(`  Users without department: ${usersWithoutDept.length}`);
    usersWithoutDept.forEach(u => {
      console.log(`    - ${u.first_name} ${u.last_name} (${u.employee_number})`);
    });
    
    console.log(`  Users without role: ${usersWithoutRole.length}`);
    usersWithoutRole.forEach(u => {
      console.log(`    - ${u.first_name} ${u.last_name} (${u.employee_number})`);
    });
    
    // 3. Check recent role history
    console.log('\n3. Recent role changes:');
    const { data: history, error: historyError } = await supabase
      .from('user_role_history')
      .select(`
        *,
        users:user_id (first_name, last_name, employee_number),
        old_departments:old_department_id (name),
        new_departments:new_department_id (name),
        old_roles:old_role_id (title),
        new_roles:new_role_id (title)
      `)
      .order('changed_at', { ascending: false })
      .limit(10);
      
    if (historyError) {
      console.error('Error fetching role history:', historyError);
    } else {
      history.forEach(h => {
        const userName = h.users ? `${h.users.first_name} ${h.users.last_name}` : 'Unknown User';
        const oldDept = h.old_departments ? h.old_departments.name : 'None';
        const newDept = h.new_departments ? h.new_departments.name : 'None';
        const oldRole = h.old_roles ? h.old_roles.title : 'None';
        const newRole = h.new_roles ? h.new_roles.title : 'None';
        const changeDate = new Date(h.changed_at).toLocaleString();
        
        console.log(`  ${changeDate} - ${userName}:`);
        console.log(`    Dept: ${oldDept} -> ${newDept}`);
        console.log(`    Role: ${oldRole} -> ${newRole}`);
        console.log(`    Reason: ${h.change_reason}`);
        console.log('');
      });
    }
    
    // 4. Test a simple update to verify database connectivity
    console.log('4. Testing database write access...');
    const testUserId = users[0]?.id;
    if (testUserId) {
      // Get current timestamp for the user
      const { data: beforeUpdate, error: beforeError } = await supabase
        .from('users')
        .select('last_updated_at')
        .eq('id', testUserId)
        .single();
        
      if (beforeError) {
        console.error('Error checking user before update:', beforeError);
      } else {
        console.log(`  Before: last_updated_at = ${beforeUpdate.last_updated_at}`);
        
        // Update the timestamp
        const { error: updateError } = await supabase
          .from('users')
          .update({ last_updated_at: new Date().toISOString() })
          .eq('id', testUserId);
          
        if (updateError) {
          console.error('Error updating user:', updateError);
        } else {
          console.log('  ✓ Test update successful');
          
          // Verify the update
          const { data: afterUpdate, error: afterError } = await supabase
            .from('users')
            .select('last_updated_at')
            .eq('id', testUserId)
            .single();
            
          if (afterError) {
            console.error('Error checking user after update:', afterError);
          } else {
            console.log(`  After: last_updated_at = ${afterUpdate.last_updated_at}`);
            console.log('  ✓ Database write/read working correctly');
          }
        }
      }
    }
    
    console.log('\n=== DEBUG COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugUserUpdates();
