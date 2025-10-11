const { createClient } = require('@supabase/supabase-js');

async function checkTitleDuplicates() {
  console.log('Starting title duplicates check...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, get all documents with their titles
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, version, current_version, status, created_at')
      .order('title', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    console.log(`Total documents: ${documents.length}`);
    console.log('='.repeat(80));

    // Group by title to find duplicates
    const titleGroups = {};
    documents.forEach(doc => {
      if (!titleGroups[doc.title]) {
        titleGroups[doc.title] = [];
      }
      titleGroups[doc.title].push(doc);
    });

    // Find and display duplicates
    const duplicates = Object.entries(titleGroups).filter(([title, docs]) => docs.length > 1);
    
    console.log(`Found ${duplicates.length} titles with duplicates:`);
    console.log('='.repeat(80));

    duplicates.forEach(([title, docs]) => {
      console.log(`\n📄 TITLE: "${title}" (${docs.length} documents)`);
      console.log('-'.repeat(60));
      
      docs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ID: ${doc.id}`);
        console.log(`     Version: ${doc.version} (Current: ${doc.current_version})`);
        console.log(`     Status: ${doc.status}`);
        console.log(`     Created: ${new Date(doc.created_at).toLocaleDateString()}`);
        console.log('');
      });
    });

    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY:');
    console.log(`- Total unique titles: ${Object.keys(titleGroups).length}`);
    console.log(`- Titles with duplicates: ${duplicates.length}`);
    console.log(`- Total duplicate documents: ${duplicates.reduce((sum, [title, docs]) => sum + docs.length - 1, 0)}`);
    
    // Show titles with most duplicates
    const sortedDuplicates = duplicates.sort((a, b) => b[1].length - a[1].length);
    console.log('\nTop titles with most duplicates:');
    sortedDuplicates.slice(0, 10).forEach(([title, docs]) => {
      console.log(`  - "${title}": ${docs.length} versions`);
    });

    // Now remove duplicates
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  REMOVING DUPLICATES...');
    console.log('='.repeat(80));

    const documentsToDelete = [];
    duplicates.forEach(([title, docs]) => {
      console.log(`\n📄 Processing "${title}":`);
      console.log(`   ✅ KEEPING: ${docs[0].id} (Created: ${new Date(docs[0].created_at).toLocaleDateString()})`);
      
      // Mark all except the first one for deletion
      for (let i = 1; i < docs.length; i++) {
        documentsToDelete.push(docs[i]);
        console.log(`   ❌ DELETING: ${docs[i].id} (Created: ${new Date(docs[i].created_at).toLocaleDateString()})`);
      }
    });

    if (documentsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${documentsToDelete.length} duplicate documents...`);
      
      // Delete in batches
      const batchSize = 10;
      let deleted = 0;

      for (let i = 0; i < documentsToDelete.length; i += batchSize) {
        const batch = documentsToDelete.slice(i, i + batchSize);
        const idsToDelete = batch.map(doc => doc.id);
        
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error(`Error deleting batch:`, deleteError);
          continue;
        }

        deleted += batch.length;
        console.log(`   Progress: ${deleted}/${documentsToDelete.length} deleted`);
      }

      console.log(`\n✅ Successfully deleted ${deleted} duplicate documents!`);
      
      // Final verification
      const { data: finalDocs } = await supabase
        .from('documents')
        .select('*', { count: 'exact' });
      
      console.log(`📊 Final document count: ${finalDocs.length}`);
    } else {
      console.log('\n✅ No duplicates to remove!');
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
checkTitleDuplicates();
