const { createClient } = require('@supabase/supabase-js');

async function removeArchivedDocuments() {
  console.log('Starting removal of archived documents...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, count archived documents
    const { data: archivedDocs, error: countError } = await supabase
      .from('documents')
      .select('id, title, status')
      .eq('status', 'archived');

    if (countError) {
      console.error('Error fetching archived documents:', countError);
      return;
    }

    console.log(`Found ${archivedDocs.length} archived documents to remove:`);
    console.log('='.repeat(60));
    
    // Show what will be deleted
    archivedDocs.forEach((doc, index) => {
      console.log(`${index + 1}. "${doc.title}" (ID: ${doc.id})`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('🗑️  Proceeding with deletion immediately...');

    // Delete archived documents
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('status', 'archived');

    if (deleteError) {
      console.error('Error deleting archived documents:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${archivedDocs.length} archived documents!`);
    
    // Verify remaining documents
    const { data: remainingDocs, error: verifyError } = await supabase
      .from('documents')
      .select('status')
      .select('*', { count: 'exact' });

    if (verifyError) {
      console.error('Error verifying remaining documents:', verifyError);
      return;
    }

    console.log(`\n📊 Remaining documents: ${remainingDocs.length}`);
    
    // Count by status
    const statusCount = {};
    remainingDocs.forEach(doc => {
      statusCount[doc.status] = (statusCount[doc.status] || 0) + 1;
    });
    
    console.log('Status breakdown:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} documents`);
    });

    console.log('\n✅ Cleanup complete! Run check-title-duplicates.js again to see the results.');

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
removeArchivedDocuments();
