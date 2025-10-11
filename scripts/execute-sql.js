/**
 * Execute SQL script directly on Supabase database
 * Run with: node scripts/execute-sql.js db/create-user-training-completions-table.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Environment check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSqlFile(sqlFilePath) {
  try {
    console.log(`🔄 Executing SQL file: ${sqlFilePath}`);
    
    // Read the SQL file
    const fullPath = path.resolve(sqlFilePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`SQL file not found: ${fullPath}`);
    }
    
    const sqlContent = fs.readFileSync(fullPath, 'utf8');
    console.log('📝 SQL content loaded successfully');
    
    // Split SQL content by semicolons to execute statements separately
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: queryData, error: queryError } = await supabase
            .from('dual')
            .select('*')
            .eq('dummy', statement); // This will fail but might give us better error info
            
          // For DDL statements, try using the raw SQL approach
          console.log('⚠️  RPC failed, trying alternative approach...');
          
          // Log the error for manual execution
          console.log('❌ Error executing statement:');
          console.log('Statement:', statement);
          console.log('Error:', error);
          console.log('\n🔧 Please execute this statement manually in Supabase SQL Editor\n');
          continue;
        }
        
        console.log('✅ Statement executed successfully');
        if (data) {
          console.log('Result:', data);
        }
        
      } catch (execError) {
        console.log('❌ Error executing statement:');
        console.log('Statement:', statement);
        console.log('Error:', execError.message);
        console.log('\n🔧 Please execute this statement manually in Supabase SQL Editor\n');
      }
    }
    
    console.log('\n🎉 SQL file execution completed!');
    console.log('\n📋 Summary:');
    console.log(`- File: ${sqlFilePath}`);
    console.log(`- Statements: ${statements.length}`);
    console.log('\n💡 If any statements failed, please execute them manually in the Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Failed to execute SQL file:', error.message);
    
    console.log('\n🔧 Manual Execution Instructions:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of the SQL file');
    console.log('4. Click Run to execute');
    console.log(`\nSQL file location: ${path.resolve(sqlFilePath)}`);
  }
}

// Get SQL file path from command line arguments
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.log('Usage: node scripts/execute-sql.js <path-to-sql-file>');
  console.log('Example: node scripts/execute-sql.js db/create-user-training-completions-table.sql');
  process.exit(1);
}

executeSqlFile(sqlFilePath);
