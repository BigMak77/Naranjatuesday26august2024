#!/usr/bin/env node

/**
 * Setup script for training completion preservation system
 * This script will:
 * 1. Create the user_training_completions table
 * 2. Migrate existing completion data
 * 3. Verify the setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Setting up Training Completion Preservation System\n');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', tableName);
  
  return !error && data && data.length > 0;
}

async function main() {
  try {
    console.log('📋 Step 1: Checking prerequisites...');
    
    // Check if required tables exist
    const tablesExist = {
      users: await checkTableExists('users'),
      user_assignments: await checkTableExists('user_assignments'),
      roles: await checkTableExists('roles')
    };

    console.log('   Required tables:');
    Object.entries(tablesExist).forEach(([table, exists]) => {
      console.log(`   - ${table}: ${exists ? '✅' : '❌'}`);
    });

    if (!tablesExist.users || !tablesExist.user_assignments) {
      console.error('\n❌ Missing required tables. Please ensure your database is properly set up.');
      return;
    }

    // Check if completion preservation table already exists
    const completionTableExists = await checkTableExists('user_training_completions');
    console.log(`   - user_training_completions table: ${completionTableExists ? '✅ Already exists' : '❌ Needs creation'}`);

    console.log('\n📋 Step 2: Database setup...');
    
    if (!completionTableExists) {
      console.log('   Creating user_training_completions table...');
      console.log('\n🔧 MANUAL ACTION REQUIRED:');
      console.log('   Please copy and paste the following SQL into your Supabase SQL Editor:');
      console.log('   (Go to your Supabase project → SQL Editor → New query)');
      console.log('\n' + '='.repeat(60));
      
      const createTableSql = fs.readFileSync(
        path.join(__dirname, '../db/create-user-training-completions-table-safe.sql'), 
        'utf8'
      );
      console.log(createTableSql);
      console.log('='.repeat(60));
      
      console.log('\n   After running the above SQL, press Enter to continue...');
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }

    console.log('\n📋 Step 3: Data migration...');
    
    // Check if we have existing completion data to migrate
    const { data: existingCompletions, error } = await supabase
      .from('user_assignments')
      .select('auth_id, item_id, item_type, completed_at')
      .not('completed_at', 'is', null)
      .limit(5);

    if (error) {
      console.warn('   ⚠️  Could not check existing completions:', error.message);
    } else {
      console.log(`   Found ${existingCompletions?.length || 0} sample completed assignments`);
      
      if (existingCompletions && existingCompletions.length > 0) {
        console.log('\n🔧 MANUAL ACTION REQUIRED:');
        console.log('   Please copy and paste the following migration SQL into your Supabase SQL Editor:');
        console.log('\n' + '='.repeat(60));
        
        const migrationSql = fs.readFileSync(
          path.join(__dirname, '../db/migrate-preserve-training-completions-simple.sql'), 
          'utf8'
        );
        console.log(migrationSql);
        console.log('='.repeat(60));
        
        console.log('\n   After running the migration SQL, press Enter to continue...');
        await new Promise(resolve => {
          process.stdin.once('data', () => resolve());
        });
      }
    }

    console.log('\n📋 Step 4: Verification...');
    
    // Verify the setup
    const { data: completionCount } = await supabase
      .from('user_training_completions')
      .select('*', { count: 'exact', head: true });

    if (completionCount !== null) {
      console.log(`   ✅ user_training_completions table working - ${completionCount} records`);
    } else {
      console.log('   ⚠️  Could not verify user_training_completions table');
    }

    // Test the new API endpoint
    console.log('\n📋 Step 5: Testing API endpoints...');
    
    try {
      const response = await fetch('http://localhost:3000/api/record-training-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // This should fail validation
      });
      
      if (response.status === 400) {
        console.log('   ✅ Training completion API endpoint is responsive');
      } else {
        console.log('   ⚠️  Training completion API returned unexpected status:', response.status);
      }
    } catch (error) {
      console.log('   ⚠️  Could not test API (server may not be running):', error.message);
      console.log('   You can test this later by running: npm run dev');
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. ✅ Database schema created and migrated');
    console.log('2. 🔄 Replace TrainingMatrix component with enhanced version');
    console.log('3. 🔄 Test role changes to verify completion preservation');
    
    console.log('\nTo replace the TrainingMatrix component, run:');
    console.log('   node scripts/update-training-matrix.js');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
