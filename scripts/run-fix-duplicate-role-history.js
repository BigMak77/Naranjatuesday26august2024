const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'fix-duplicate-role-history.sql');

if (!fs.existsSync(sqlFile)) {
  console.error(`❌ SQL file not found: ${sqlFile}`);
  process.exit(1);
}

console.log('🔧 Fixing duplicate role history entries...');
console.log('📄 SQL file:', sqlFile);

try {
  const result = execSync(`npx supabase db execute --file "${sqlFile}"`, {
    encoding: 'utf-8',
    stdio: 'pipe',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Success!');
  console.log(result);

  console.log('\n📝 What was done:');
  console.log('  1. Disabled the automatic trigger that was creating duplicate entries');
  console.log('  2. Cleaned up existing duplicate entries (kept entries with changed_by, removed system entries)');
  console.log('  3. Future role changes will only create one entry via the DepartmentRoleManager component');

} catch (error) {
  console.error('❌ Error executing SQL:', error.message);
  if (error.stdout) console.log('Output:', error.stdout.toString());
  if (error.stderr) console.error('Error:', error.stderr.toString());
  process.exit(1);
}
