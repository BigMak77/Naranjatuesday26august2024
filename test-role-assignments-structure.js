// Quick test to check role_assignments table structure
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('supabaseUrl:', supabaseUrl ? 'Set' : 'Not set');
console.log('supabaseKey:', supabaseKey ? 'Set' : 'Not set');

if (!supabaseUrl || !supabaseKey) {
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoleAssignments() {
  try {
    console.log('🔍 Testing role_assignments table structure...\n');
    
    // Test 1: Check if we can query the table and see its structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('role_assignments')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error querying role_assignments:', sampleError);
      return;
    }
    
    if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample row structure:');
      console.log(Object.keys(sampleData[0]));
      console.log('Sample data:', sampleData[0]);
    } else {
      console.log('ℹ️  No data in role_assignments table');
    }
    
    // Test 2: Get real module and document IDs
    console.log('\n🔍 Getting real module and document IDs...');
    const { data: modules } = await supabase.from('modules').select('id').limit(1);
    const { data: documents } = await supabase.from('documents').select('id').limit(1);
    const { data: roles } = await supabase.from('roles').select('id').limit(1);
    
    if (!modules || !documents || !roles || modules.length === 0 || documents.length === 0 || roles.length === 0) {
      console.log('❌ Need at least one module, document, and role to test');
      return;
    }
    
    console.log('Found:', { 
      moduleId: modules[0].id, 
      documentId: documents[0].id, 
      roleId: roles[0].id 
    });
    
    // Test 2: Try inserting a test row with both old and new structure
    console.log('\n🧪 Testing insert with legacy column compatibility...');
    
    const testRow = {
      role_id: roles[0].id,
      item_id: modules[0].id, // Same as module_id
      module_id: modules[0].id, // Legacy column with real module ID
      document_id: null, // Legacy column
      type: 'module'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('role_assignments')
      .insert(testRow)
      .select();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Code:', insertError.code);
      console.error('Message:', insertError.message);
      console.error('Details:', insertError.details);
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Clean up test data
      await supabase
        .from('role_assignments')
        .delete()
        .eq('item_id', modules[0].id)
        .eq('role_id', roles[0].id);
      console.log('🧹 Test data cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testRoleAssignments();
