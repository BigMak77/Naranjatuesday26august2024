// Test script to run the sync-training-from-profile API endpoint
const fetch = require('node-fetch');

async function testSyncTraining() {
  const roleId = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  
  console.log(`🚀 Testing sync training for role_id: ${roleId}`);
  console.log('Expected: 8 users × 50 training items = 400 total assignments');
  console.log('Current: 215 assignments (missing ~185)');
  console.log('---');

  try {
    const response = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role_id: roleId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync completed successfully!');
      console.log(`📊 Inserted ${result.inserted} new assignments`);
      console.log('---');
      console.log('Next steps:');
      console.log('1. Run the verification SQL to check final counts');
      console.log('2. All 8 users should now have their complete training assignments');
    } else {
      console.error('❌ Sync failed:');
      console.error('Status:', response.status);
      console.error('Error:', result);
    }
  } catch (error) {
    console.error('❌ Request failed:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your Next.js development server is running:');
      console.log('   npm run dev');
      console.log('   or');
      console.log('   yarn dev');
    }
  }
}

testSyncTraining();
