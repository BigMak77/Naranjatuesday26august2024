const { createClient } = require('@supabase/supabase-js');

async function checkFinalState() {
  console.log('Checking final state after duplicate removal...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all remaining documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, version, current_version, status, created_at')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    console.log(`📊 Total remaining documents: ${documents.length}`);

    // Group by title to find any remaining duplicates
    const titleGroups = {};
    documents.forEach(doc => {
      if (!titleGroups[doc.title]) {
        titleGroups[doc.title] = [];
      }
      titleGroups[doc.title].push(doc);
    });

    const remainingDuplicates = Object.entries(titleGroups).filter(([title, docs]) => docs.length > 1);
    
    if (remainingDuplicates.length === 0) {
      console.log('🎉 SUCCESS: No duplicate titles remain!');
      console.log(`✅ All ${documents.length} documents now have unique titles.`);
    } else {
      console.log(`⚠️  Found ${remainingDuplicates.length} titles that still have duplicates:`);
      console.log('='.repeat(60));
      
      remainingDuplicates.forEach(([title, docs]) => {
        console.log(`\n📄 "${title}" (${docs.length} documents):`);
        docs.forEach((doc, index) => {
          console.log(`   ${index + 1}. ID: ${doc.id}`);
        });
      });
      
      console.log('\nℹ️  These may be protected by foreign key constraints.');
    }

    // Show some statistics
    console.log('\n' + '='.repeat(60));
    console.log('📈 FINAL STATISTICS:');
    console.log(`- Total documents: ${documents.length}`);
    console.log(`- Unique titles: ${Object.keys(titleGroups).length}`);
    console.log(`- Duplicate titles: ${remainingDuplicates.length}`);
    
    const statusCount = {};
    documents.forEach(doc => {
      statusCount[doc.status] = (statusCount[doc.status] || 0) + 1;
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} documents`);
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
checkFinalState();
