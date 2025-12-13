#!/bin/bash

# Clean up script for user assignments table
# This script handles remaining data accuracy issues

echo "🧹 CLEANING UP USER ASSIGNMENTS TABLE"
echo "===================================="

cd "/Users/bigmak/Documents/Naranja 4.3 copy"

echo ""
echo "1️⃣ Fixing users without roles..."
echo "Users without roles cannot get role-based training assignments."
echo "These users need to be assigned appropriate roles:"

# Show users without roles
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env
const envPath = './.env.local';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function showUsersWithoutRoles() {
  const { data: users } = await supabase
    .from('users')
    .select('first_name, last_name, employee_number, department_id, departments:department_id (name)')
    .is('role_id', null)
    .not('employee_number', 'is', null)
    .order('first_name');
    
  if (users && users.length > 0) {
    console.log('👤 Users needing role assignment:');
    users.forEach(user => {
      const deptName = user.departments ? user.departments.name : 'NO DEPT';
      console.log(\`  - \${user.first_name} \${user.last_name} (\${user.employee_number}) in \${deptName}\`);
    });
    console.log(\`\nTotal: \${users.length} users need roles\`);
  } else {
    console.log('✅ All users have roles assigned');
  }
}

showUsersWithoutRoles().catch(console.error);
"

echo ""
echo "2️⃣ Checking for duplicate assignments..."

npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function findDuplicates() {
  const { data: duplicates } = await supabase
    .from('user_assignments')
    .select('auth_id, item_id, item_type, count(*)')
    .group('auth_id, item_id, item_type')
    .having('count(*)', 'gt', 1);
    
  if (duplicates && duplicates.length > 0) {
    console.log('⚠️  Found duplicate assignments:', duplicates.length);
  } else {
    console.log('✅ No duplicate assignments found');
  }
}

findDuplicates();
"

echo ""
echo "3️⃣ Checking assignment coverage..."

npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCoverage() {
  // Users with roles but no assignments  
  const { data: usersWithoutAssignments } = await supabase
    .from('users')
    .select('auth_id, first_name, last_name')
    .not('auth_id', 'is', null)
    .not('role_id', 'is', null);
    
  let usersWithNoTraining = [];
  
  for (const user of usersWithoutAssignments || []) {
    const { data: assignments } = await supabase
      .from('user_assignments')
      .select('id')
      .eq('auth_id', user.auth_id);
      
    if (!assignments || assignments.length === 0) {
      usersWithNoTraining.push(user);
    }
  }
  
  console.log(\`📊 Coverage Summary:\`);
  console.log(\`  Total users with roles: \${usersWithoutAssignments?.length || 0}\`);
  console.log(\`  Users with no training: \${usersWithNoTraining.length}\`);
  
  if (usersWithNoTraining.length > 0) {
    console.log('\\n👤 Users with no training assignments:');
    usersWithNoTraining.slice(0, 10).forEach(user => {
      console.log(\`  - \${user.first_name} \${user.last_name}\`);
    });
    if (usersWithNoTraining.length > 10) {
      console.log(\`  ... and \${usersWithNoTraining.length - 10} more\`);
    }
  }
}

checkCoverage();
"

echo ""
echo "✅ User assignments table cleanup completed!"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. Assign roles to users who don't have them"
echo "2. Create training assignments for roles that need them"  
echo "3. Run the training matrix to verify all users show correct assignments"
echo ""
