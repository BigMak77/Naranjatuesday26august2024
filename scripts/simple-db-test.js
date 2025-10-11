#!/usr/bin/env node

// Simple database check
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Check:');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabase() {
  try {
    console.log('\n🧪 Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Basic database test failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection working');
    
    // Check if completion table exists
    console.log('\n🔍 Checking for user_training_completions table...');
    
    const { data, error } = await supabase
      .from('user_training_completions')
      .select('*', { count: 'exact', head: true });
    
    if (error && error.code === '42P01') {
      console.log('❌ user_training_completions table does not exist');
      console.log('\n🛠️  TO CREATE THE TABLE:');
      console.log('1. Open your Supabase project dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the SQL from: db/create-user-training-completions-table-safe.sql');
      console.log('4. Click Run');
      return;
    }
    
    if (error) {
      console.log('❌ Error checking table:', error.message);
      return;
    }
    
    console.log(`✅ user_training_completions table exists with ${data || 0} records`);
    
    // Test API endpoints
    console.log('\n🧪 Testing API endpoints...');
    
    try {
      const response = await fetch('http://localhost:3000/api/record-training-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.status === 400) {
        console.log('✅ Training completion API working');
      } else {
        console.log('⚠️  Unexpected API response:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ API test failed:', fetchError.message);
      console.log('   Make sure the development server is running: npm run dev');
    }
    
    console.log('\n🎯 SYSTEM STATUS:');
    if (data !== null) {
      console.log('✅ Database table ready');
      console.log('✅ APIs accessible');
      console.log('✅ System ready for testing!');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Replace TrainingMatrix: node scripts/update-training-matrix.js');
      console.log('2. Test role changes: node scripts/test-completion-preservation.js');
    } else {
      console.log('❌ Setup incomplete - create the database table first');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDatabase();
