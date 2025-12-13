// Check roles for Mixing & Material Prep department
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

async function checkDepartmentRoles() {
  try {
    // Find Mixing & Material Prep department
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('name', 'Mixing & Material Prep')
      .single();
      
    if (deptError || !dept) {
      console.error('Could not find Mixing & Material Prep department:', deptError);
      return;
    }
    
    console.log('Department:', dept);
    
    // Find roles for this department
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('department_id', dept.id);
      
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return;
    }
    
    console.log(`\nRoles for ${dept.name}:`, roles);
    
    // If no roles exist, let's check all departments and their roles
    if (!roles || roles.length === 0) {
      console.log('\nNo roles found! Checking all departments with roles:');
      
      const { data: allDepts, error: allDeptsError } = await supabase
        .from('departments')
        .select(`
          name,
          roles (id, title)
        `)
        .order('name');
        
      if (allDeptsError) {
        console.error('Error fetching all departments:', allDeptsError);
        return;
      }
      
      allDepts.forEach(d => {
        if (d.roles && d.roles.length > 0) {
          console.log(`${d.name}: ${d.roles.map(r => r.title).join(', ')}`);
        } else {
          console.log(`${d.name}: NO ROLES`);
        }
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkDepartmentRoles();
