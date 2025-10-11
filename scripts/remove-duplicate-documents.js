const { createClient } = require('@supabase/supabase-js');

async function removeDuplicateDocuments() {
  console.log('Starting removal of duplicate documents...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, version, current_version, status, created_at')
      .order('title', { ascending: true })
      .order('created_at', { ascending: true }); // Keep the earliest created

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    console.log(`Total documents: ${documents.length}`);

    // Group by title to find duplicates
    const titleGroups = {};
    documents.forEach(doc => {
      if (!titleGroups[doc.title]) {
        titleGroups[doc.title] = [];
      }
      titleGroups[doc.title].push(doc);
    });

    // Find duplicates and determine which ones to delete
    const documentsToDelete = [];
    const duplicates = Object.entries(titleGroups).filter(([title, docs]) => docs.length > 1);
    
    console.log(`Found ${duplicates.length} titles with duplicates:`);
    console.log('='.repeat(80));

    duplicates.forEach(([title, docs]) => {
      console.log(`\n📄 TITLE: "${title}" (${docs.length} documents)`);
      console.log(`   ✅ KEEPING: ID ${docs[0].id} (Created: ${new Date(docs[0].created_at).toLocaleDateString()})`);
      
      // Mark all except the first one for deletion
      for (let i = 1; i < docs.length; i++) {
        documentsToDelete.push(docs[i]);
        console.log(`   ❌ DELETING: ID ${docs[i].id} (Created: ${new Date(docs[i].created_at).toLocaleDateString()})`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`SUMMARY:`);
    console.log(`- Documents to keep: ${documents.length - documentsToDelete.length}`);
    console.log(`- Documents to delete: ${documentsToDelete.length}`);
    console.log(`- Titles affected: ${duplicates.length}`);

    if (documentsToDelete.length === 0) {
      console.log('✅ No duplicates found to delete!');
      return;
    }

    console.log('\n🗑️  Proceeding with deletion...');

    // Delete duplicates in batches
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
        console.error(`Error deleting batch ${i}-${i + batch.length}:`, deleteError);
        continue;
      }

      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${documentsToDelete.length} documents...`);
    }

    console.log(`\n✅ Successfully deleted ${deleted} duplicate documents!`);
    
    // Verify final state
    const { data: finalDocs, error: verifyError } = await supabase
      .from('documents')
      .select('*', { count: 'exact' });

    if (verifyError) {
      console.error('Error verifying final state:', verifyError);
      return;
    }

    console.log(`\n📊 Final document count: ${finalDocs.length}`);
    console.log('✅ Cleanup complete! Run check-title-duplicates.js to verify no duplicates remain.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
removeDuplicateDocuments();
