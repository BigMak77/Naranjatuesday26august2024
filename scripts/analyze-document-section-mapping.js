/**
 * Analyze documents and sections to determine proper mapping strategy
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeMapping() {
  console.log('🔍 Analyzing document-section mapping...\n');

  // Fetch all documents
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, title, reference_code, section_id')
    .order('reference_code');

  if (docsError) {
    console.error('Error fetching documents:', docsError);
    return;
  }

  // Fetch all sections
  const { data: sections, error: sectionsError } = await supabase
    .from('standard_sections')
    .select('id, standard_id, code, title')
    .order('code');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    return;
  }

  console.log(`📊 Total Documents: ${documents.length}`);
  console.log(`📊 Total Sections: ${sections.length}\n`);

  // Group documents by current section_id
  const docsBySection = {};
  documents.forEach(doc => {
    const sid = doc.section_id || 'NULL';
    if (!docsBySection[sid]) docsBySection[sid] = [];
    docsBySection[sid].push(doc);
  });

  console.log('📍 Documents grouped by current section_id:');
  Object.entries(docsBySection).forEach(([sectionId, docs]) => {
    console.log(`  ${sectionId}: ${docs.length} documents`);
  });
  console.log('');

  // Create a map of section codes to section IDs
  const sectionsByCode = {};
  sections.forEach(section => {
    sectionsByCode[section.code] = section;
  });

  console.log('🔗 Available section codes:');
  sections.forEach(s => {
    console.log(`  ${s.code.padEnd(10)} - ${s.title}`);
  });
  console.log('');

  // Analyze potential matches
  console.log('🎯 Analyzing potential document → section matches:\n');

  const matches = [];
  const noMatches = [];

  documents.forEach(doc => {
    const refCode = doc.reference_code || '';

    // Try to extract section code from reference_code
    // Common patterns: "1.1", "1.1.1", "ISO9001-1.1", "HSE-1.1.2", etc.
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

    if (sectionCode && sectionsByCode[sectionCode]) {
      const section = sectionsByCode[sectionCode];
      const isCorrect = doc.section_id === section.id;

      matches.push({
        docId: doc.id,
        docTitle: doc.title,
        docRef: doc.reference_code,
        currentSectionId: doc.section_id,
        matchedSectionCode: sectionCode,
        matchedSectionId: section.id,
        matchedSectionTitle: section.title,
        needsUpdate: !isCorrect
      });

      console.log(`${isCorrect ? '✅' : '🔄'} "${doc.title}"`);
      console.log(`   Ref: ${refCode} → Section: ${sectionCode} (${section.title})`);
      console.log(`   Current: ${doc.section_id || 'NULL'}`);
      console.log(`   Correct: ${section.id}`);
      if (!isCorrect) console.log(`   ⚠️  NEEDS UPDATE`);
      console.log('');
    } else {
      noMatches.push({
        docId: doc.id,
        docTitle: doc.title,
        docRef: doc.reference_code,
        currentSectionId: doc.section_id
      });
    }
  });

  console.log('\n📈 Summary:');
  console.log(`  ✅ Documents with matches: ${matches.length}`);
  console.log(`  🔄 Documents needing updates: ${matches.filter(m => m.needsUpdate).length}`);
  console.log(`  ❌ Documents without matches: ${noMatches.length}`);

  if (noMatches.length > 0) {
    console.log('\n⚠️  Documents without section matches:');
    noMatches.forEach(doc => {
      console.log(`  - "${doc.docTitle}" (ref: ${doc.docRef || 'NULL'})`);
    });
  }

  // Save analysis results
  return {
    matches,
    noMatches,
    sectionsByCode
  };
}

analyzeMapping()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
