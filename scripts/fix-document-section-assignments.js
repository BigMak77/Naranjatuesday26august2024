/**
 * Fix document-section assignments by matching reference codes to section codes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixDocumentSections(dryRun = true) {
  console.log('🔧 Starting document-section assignment fix...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}\n`);

  // Fetch all documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, title, reference_code, section_id')
    .order('reference_code');

  if (docsError) {
    console.error('❌ Error fetching documents:', docsError);
    return;
  }

  // Fetch all sections
  const { data: sections, error: sectionsError } = await supabase
    .from('standard_sections')
    .select('id, standard_id, code, title')
    .order('code');

  if (sectionsError) {
    console.error('❌ Error fetching sections:', sectionsError);
    return;
  }

  // Create a map of section codes to section IDs
  const sectionsByCode = {};
  sections.forEach(section => {
    sectionsByCode[section.code] = section;
  });

  console.log(`📊 Found ${documents.length} documents and ${sections.length} sections\n`);

  // Track updates
  const updates = [];
  let matchedCount = 0;
  let alreadyCorrectCount = 0;
  let noMatchCount = 0;

  // Process each document
  for (const doc of documents) {
    const refCode = doc.reference_code || '';

    // Try to extract section code from reference_code
    let sectionCode = null;

    // Pattern 1: Direct match (e.g., "1.1", "1.1.1")
    if (sectionsByCode[refCode]) {
      sectionCode = refCode;
    }

    // Pattern 2: Code after dash (e.g., "ISO9001-1.1" → "1.1")
    if (!sectionCode && refCode.includes('-')) {
      const parts = refCode.split('-');
      const lastPart = parts[parts.length - 1];
      if (sectionsByCode[lastPart]) {
        sectionCode = lastPart;
      }
    }

    // Pattern 3: Extract numeric pattern (e.g., "ISO9001-1-WO" → "1")
    if (!sectionCode) {
      const numericMatch = refCode.match(/(\d+(?:\.\d+)*)/);
      if (numericMatch && sectionsByCode[numericMatch[1]]) {
        sectionCode = numericMatch[1];
      }
    }

    // Pattern 4: HSE special case - extract number before dash
    if (!sectionCode && refCode.startsWith('HSE-')) {
      // e.g., "HSE-1-PO" → "1", "HSE-HS-1" → "1"
      const hseMatch = refCode.match(/HSE-(?:HS-)?(\d+)/);
      if (hseMatch && sectionsByCode[hseMatch[1]]) {
        sectionCode = hseMatch[1];
      }
    }

    if (sectionCode && sectionsByCode[sectionCode]) {
      const section = sectionsByCode[sectionCode];

      if (doc.section_id === section.id) {
        // Already correct
        alreadyCorrectCount++;
      } else {
        // Needs update
        matchedCount++;
        updates.push({
          id: doc.id,
          title: doc.title,
          reference_code: doc.reference_code,
          current_section_id: doc.section_id,
          new_section_id: section.id,
          new_section_code: sectionCode,
          new_section_title: section.title
        });
      }
    } else {
      noMatchCount++;
      console.log(`⚠️  No match for: "${doc.title}" (ref: ${refCode})`);
    }
  }

  console.log('\n📈 Analysis Summary:');
  console.log(`  ✅ Already correct: ${alreadyCorrectCount}`);
  console.log(`  🔄 Need updates: ${matchedCount}`);
  console.log(`  ❌ No matches: ${noMatchCount}`);
  console.log('');

  if (updates.length === 0) {
    console.log('✅ All documents are already correctly assigned!');
    return;
  }

  // Show sample of updates
  console.log('📋 Sample of updates to be made:');
  updates.slice(0, 10).forEach(update => {
    console.log(`  "${update.title}"`);
    console.log(`    Ref: ${update.reference_code} → Section ${update.new_section_code}: ${update.new_section_title}`);
  });

  if (updates.length > 10) {
    console.log(`  ... and ${updates.length - 10} more\n`);
  } else {
    console.log('');
  }

  if (dryRun) {
    console.log('🔍 DRY RUN - No changes made');
    console.log('💡 To apply these changes, run: node scripts/fix-document-section-assignments.js --live');
    return updates;
  }

  // Actually update the database
  console.log('🚀 Applying updates to database...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error } = await supabase
      .from('documents')
      .update({ section_id: update.new_section_id })
      .eq('id', update.id);

    if (error) {
      console.error(`❌ Error updating "${update.title}":`, error);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`  Updated ${successCount}/${updates.length}...`);
      }
    }
  }

  console.log('\n✅ Migration complete!');
  console.log(`  ✅ Successfully updated: ${successCount}`);
  if (errorCount > 0) {
    console.log(`  ❌ Errors: ${errorCount}`);
  }

  return updates;
}

// Parse command line arguments
const args = process.argv.slice(2);
const isLive = args.includes('--live');

fixDocumentSections(!isLive)
  .then((updates) => {
    if (updates && updates.length > 0) {
      console.log(`\n📊 Total updates ${isLive ? 'applied' : 'identified'}: ${updates.length}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
