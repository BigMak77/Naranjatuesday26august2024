const fs = require('fs');
const path = require('path');

// Read the SQL file
const sqlPath = path.join(__dirname, 'fix-user-assignments-rls.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('='.repeat(80));
console.log('USER ASSIGNMENTS RLS POLICY FIX');
console.log('='.repeat(80));
console.log('\nThis script needs to be run via Supabase SQL Editor.\n');
console.log('Please follow these steps:\n');
console.log('1. Go to your Supabase Dashboard: https://app.supabase.com');
console.log('2. Select your project');
console.log('3. Navigate to SQL Editor (in the left sidebar)');
console.log('4. Click "New query"');
console.log('5. Copy and paste the SQL below');
console.log('6. Click "Run" to execute\n');
console.log('='.repeat(80));
console.log('SQL TO EXECUTE:');
console.log('='.repeat(80));
console.log('\n' + sql + '\n');
console.log('='.repeat(80));
console.log('\nAlternatively, you can run this command if you have psql configured:');
console.log(`psql "$DATABASE_URL" -f "${sqlPath}"`);
console.log('='.repeat(80));
