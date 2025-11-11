const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateDocumentsFromSections() {
  console.log('=== Populating Documents from Sections ===\n');

  // Get or create "Section" document type
  let { data: docTypes } = await supabase
    .from('document_types')
    .select('id, name')
    .eq('name', 'Section')
    .limit(1);

  let sectionTypeId = null;
  if (docTypes && docTypes.length > 0) {
    sectionTypeId = docTypes[0].id;
    console.log('✓ Found existing Section document type:', sectionTypeId);
  } else {
    // Create Section document type
    const { data: newType, error: createError } = await supabase
      .from('document_types')
      .insert({ name: 'Section' })
      .select()
      .single();

    if (createError) {
      console.error('Error creating Section document type:', createError);
      process.exit(1);
    }
    sectionTypeId = newType.id;
    console.log('✓ Created Section document type:', sectionTypeId);
  }

  // Get all sections
  const { data: sections, error: sectionsError } = await supabase
    .from('standard_sections')
    .select('id, code, title, description, parent_section_id, standard_id')
    .order('code');

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError);
    process.exit(1);
  }

  console.log(`✓ Found ${sections.length} sections\n`);

  // Separate parent and child sections
  const parentSections = sections.filter(s => !s.parent_section_id);
  const childSections = sections.filter(s => s.parent_section_id);

  console.log(`  - Parent sections: ${parentSections.length}`);
  console.log(`  - Child sections: ${childSections.length}\n`);

  // Create documents for all sections
  const documentsToInsert = sections.map(section => ({
    title: section.title,
    reference_code: section.code,
    notes: section.description || null,
    document_type_id: sectionTypeId,
    section_id: section.id,
    current_version: 1,
    archived: false,
    created_at: new Date().toISOString()
  }));

  console.log(`Creating ${documentsToInsert.length} documents...\n`);

  // Insert documents in batches
  const batchSize = 50;
  let insertedDocuments = 0;
  let errors = 0;

  for (let i = 0; i < documentsToInsert.length; i += batchSize) {
    const batch = documentsToInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('documents')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
      errors += batch.length;
    } else {
      insertedDocuments += data.length;
      console.log(`✓ Inserted batch ${i / batchSize + 1}: ${data.length} documents`);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`✓ Documents created: ${insertedDocuments}`);
  console.log(`  - From parent sections: ${parentSections.length}`);
  console.log(`  - From child sections: ${childSections.length}`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors}`);
  }
  console.log(`\nTotal sections processed: ${sections.length}`);
}

populateDocumentsFromSections().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
