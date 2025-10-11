const { createClient } = require('@supabase/supabase-js');

async function cleanupRemainingDuplicates() {
  console.log('Cleaning up remaining duplicates with proper reference handling...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all documents and group by title
    const { data: documents } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .order('title')
      .order('created_at');

    const titleGroups = {};
    documents.forEach(doc => {
      if (!titleGroups[doc.title]) {
        titleGroups[doc.title] = [];
      }
      titleGroups[doc.title].push(doc);
    });

    const duplicates = Object.entries(titleGroups).filter(([title, docs]) => docs.length > 1);
    
    console.log(`Found ${duplicates.length} titles with remaining duplicates`);

    for (const [title, docs] of duplicates) {
      console.log(`\n📄 Processing "${title}" (${docs.length} documents):`);
      
      // Keep the first document (oldest)
      const keepDoc = docs[0];
      const deleteIds = docs.slice(1).map(d => d.id);
      
      console.log(`   ✅ KEEPING: ${keepDoc.id}`);
      
      for (const deleteDoc of docs.slice(1)) {
        console.log(`   🔄 PROCESSING: ${deleteDoc.id}`);
        
        // Check and transfer any references
        const { data: references } = await supabase
          .from('role_profile_documents')
          .select('*')
          .eq('document_id', deleteDoc.id);
        
        if (references && references.length > 0) {
          console.log(`      📎 Found ${references.length} references to transfer`);
          
          // Transfer references to the kept document
          for (const ref of references) {
            // Check if reference to kept document already exists
            const { data: existingRef } = await supabase
              .from('role_profile_documents')
              .select('*')
              .eq('role_id', ref.role_id)
              .eq('document_id', keepDoc.id);
            
            if (!existingRef || existingRef.length === 0) {
              // Update reference to point to kept document
              await supabase
                .from('role_profile_documents')
                .update({ document_id: keepDoc.id })
                .eq('id', ref.id);
              console.log(`      ✅ Transferred reference ${ref.id}`);
            } else {
              // Delete duplicate reference
              await supabase
                .from('role_profile_documents')
                .delete()
                .eq('id', ref.id);
              console.log(`      🗑️  Removed duplicate reference ${ref.id}`);
            }
          }
        }
        
        // Now delete the duplicate document
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', deleteDoc.id);
        
        if (deleteError) {
          console.log(`      ❌ Error deleting ${deleteDoc.id}:`, deleteError.message);
        } else {
          console.log(`      ✅ Deleted ${deleteDoc.id}`);
        }
      }
    }

    // Final verification
    const { data: finalDocs, count } = await supabase
      .from('documents')
      .select('title', { count: 'exact' });

    const finalTitleGroups = {};
    finalDocs.forEach(doc => {
      finalTitleGroups[doc.title] = (finalTitleGroups[doc.title] || 0) + 1;
    });
    
    const finalDuplicates = Object.entries(finalTitleGroups).filter(([title, count]) => count > 1);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS:');
    console.log(`- Total documents: ${count}`);
    console.log(`- Unique titles: ${Object.keys(finalTitleGroups).length}`);
    console.log(`- Remaining duplicates: ${finalDuplicates.length}`);
    
    if (finalDuplicates.length === 0) {
      console.log('\n🎉 SUCCESS: All document titles are now unique!');
    } else {
      console.log('\nRemaining duplicates:', finalDuplicates);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
cleanupRemainingDuplicates();
