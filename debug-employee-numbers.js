const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmployeeNumbers() {
  try {
    console.log('Checking employee numbers in the database...');
    
    // Get all users with employee numbers
    const { data: usersWithNumbers, error: numbersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, employee_number, is_leaver, created_at')
      .not('employee_number', 'is', null)
      .order('employee_number', { ascending: true });

    if (numbersError) {
      console.error('Error fetching users with employee numbers:', numbersError);
      return;
    }

    console.log(`\nFound ${usersWithNumbers.length} users with employee numbers:`);
    
    if (usersWithNumbers.length > 0) {
      console.log('First 10 users:');
      usersWithNumbers.slice(0, 10).forEach(user => {
        console.log(`  ${user.employee_number}: ${user.first_name} ${user.last_name} (leaver: ${user.is_leaver})`);
      });
      
      if (usersWithNumbers.length > 10) {
        console.log(`  ... and ${usersWithNumbers.length - 10} more`);
      }
      
      console.log(`\nEmployee number range: ${usersWithNumbers[0].employee_number} - ${usersWithNumbers[usersWithNumbers.length - 1].employee_number}`);
    }
    
    // Get all users without employee numbers (new starters)
    const { data: newStarters, error: startersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, created_at')
      .is('employee_number', null)
      .eq('is_leaver', false)
      .order('created_at', { ascending: false });

    if (startersError) {
      console.error('Error fetching new starters:', startersError);
      return;
    }

    console.log(`\nFound ${newStarters.length} new starters (no employee number yet):`);
    newStarters.slice(0, 5).forEach(user => {
      console.log(`  ${user.first_name} ${user.last_name} - ${user.email}`);
    });

    // Get leavers
    const { data: leavers, error: leaversError } = await supabase
      .from('users')
      .select('id, first_name, last_name, employee_number, leaver_date')
      .eq('is_leaver', true)
      .order('leaver_date', { ascending: false });

    if (leaversError) {
      console.error('Error fetching leavers:', leaversError);
      return;
    }

    console.log(`\nFound ${leavers.length} leavers:`);
    leavers.slice(0, 5).forEach(user => {
      console.log(`  ${user.employee_number || 'No #'}: ${user.first_name} ${user.last_name} (left: ${user.leaver_date})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkEmployeeNumbers();
