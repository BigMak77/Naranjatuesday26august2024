const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse the clause data
const clauseData = `1.1.1	Clause 1.1.1 Top Manacdoller	Summary placeholder for clause 1.1.1
1.1.2	Clause 1.1.2 Top Manacdoller	Summary placeholder for clause 1.1.2
1.1.3	Clause 1.1.3 Top Manacdoller	Summary placeholder for clause 1.1.3
1.1.4	Clause 1.1.4 Top Manacdoller	Summary placeholder for clause 1.1.4
1.2.1	Clause 1.2.1 Top Manacdoller	Summary placeholder for clause 1.2.1
1.2.2	Clause 1.2.2 Top Manacdoller	Summary placeholder for clause 1.2.2
1.2.3	Clause 1.2.3 Top Manacdoller	Summary placeholder for clause 1.2.3
2.1.1	Clause 2.1.1 Top Manacdoller	Summary placeholder for clause 2.1.1
2.1.2	Clause 2.1.2 Top Manacdoller	Summary placeholder for clause 2.1.2
2.1.3	Clause 2.1.3 Top Manacdoller	Summary placeholder for clause 2.1.3
2.2.1	Clause 2.2.1 Top Manacdoller	Summary placeholder for clause 2.2.1
2.2.2	Clause 2.2.2 Top Manacdoller	Summary placeholder for clause 2.2.2
2.3.1	Clause 2.3.1 Top Manacdoller	Summary placeholder for clause 2.3.1
2.3.2	Clause 2.3.2 Top Manacdoller	Summary placeholder for clause 2.3.2
2.4.1	Clause 2.4.1 Top Manacdoller	Summary placeholder for clause 2.4.1
2.4.2	Clause 2.4.2 Top Manacdoller	Summary placeholder for clause 2.4.2
2.5.1	Clause 2.5.1 Top Manacdoller	Summary placeholder for clause 2.5.1
2.5.2	Clause 2.5.2 Top Manacdoller	Summary placeholder for clause 2.5.2
2.6.1	Clause 2.6.1 Top Manacdoller	Summary placeholder for clause 2.6.1
2.6.2	Clause 2.6.2 Top Manacdoller	Summary placeholder for clause 2.6.2
2.7.1	Clause 2.7.1 Top Manacdoller	Summary placeholder for clause 2.7.1
2.7.2	Clause 2.7.2 Top Manacdoller	Summary placeholder for clause 2.7.2
2.8.1	Clause 2.8.1 Top Manacdoller	Summary placeholder for clause 2.8.1
2.8.2	Clause 2.8.2 Top Manacdoller	Summary placeholder for clause 2.8.2
2.9.1	Clause 2.9.1 Top Manacdoller	Summary placeholder for clause 2.9.1
2.9.2	Clause 2.9.2 Top Manacdoller	Summary placeholder for clause 2.9.2
2.9.3	Clause 2.9.3 Top Manacdoller	Summary placeholder for clause 2.9.3
2.10.1	Clause 2.10.1 Top Manacdoller	Summary placeholder for clause 2.10.1
2.10.2	Clause 2.10.2 Top Manacdoller	Summary placeholder for clause 2.10.2
2.11.1	Clause 2.11.1 Top Manacdoller	Summary placeholder for clause 2.11.1
2.11.2	Clause 2.11.2 Top Manacdoller	Summary placeholder for clause 2.11.2
2.11.3	Clause 2.11.3 Top Manacdoller	Summary placeholder for clause 2.11.3
2.12.1	Clause 2.12.1 Top Manacdoller	Summary placeholder for clause 2.12.1
2.12.2	Clause 2.12.2 Top Manacdoller	Summary placeholder for clause 2.12.2
2.13.1	Clause 2.13.1 Top Manacdoller	Summary placeholder for clause 2.13.1
2.13.2	Clause 2.13.2 Top Manacdoller	Summary placeholder for clause 2.13.2
2.13.3	Clause 2.13.3 Top Manacdoller	Summary placeholder for clause 2.13.3
2.13.4	Clause 2.13.4 Top Manacdoller	Summary placeholder for clause 2.13.4
2.13.5	Clause 2.13.5 Top Manacdoller	Summary placeholder for clause 2.13.5
2.13.6	Clause 2.13.6 Top Manacdoller	Summary placeholder for clause 2.13.6
3.1.1	Clause 3.1.1 Top Manacdoller	Summary placeholder for clause 3.1.1
3.2.1	Clause 3.2.1 Top Manacdoller	Summary placeholder for clause 3.2.1
3.3.1	Clause 3.3.1 Top Manacdoller	Summary placeholder for clause 3.3.1
3.4.1	Clause 3.4.1 Top Manacdoller	Summary placeholder for clause 3.4.1
3.5.1	Clause 3.5.1 Top Manacdoller	Summary placeholder for clause 3.5.1
3.5.2	Clause 3.5.2 Top Manacdoller	Summary placeholder for clause 3.5.2
3.5.3	Clause 3.5.3 Top Manacdoller	Summary placeholder for clause 3.5.3
3.6.1	Clause 3.6.1 Top Manacdoller	Summary placeholder for clause 3.6.1
3.6.2	Clause 3.6.2 Top Manacdoller	Summary placeholder for clause 3.6.2
3.7.1	Clause 3.7.1 Top Manacdoller	Summary placeholder for clause 3.7.1
3.7.2	Clause 3.7.2 Top Manacdoller	Summary placeholder for clause 3.7.2
3.8.1	Clause 3.8.1 Top Manacdoller	Summary placeholder for clause 3.8.1
3.8.2	Clause 3.8.2 Top Manacdoller	Summary placeholder for clause 3.8.2
3.9.1	Clause 3.9.1 Top Manacdoller	Summary placeholder for clause 3.9.1
3.9.2	Clause 3.9.2 Top Manacdoller	Summary placeholder for clause 3.9.2
3.9.3	Clause 3.9.3 Top Manacdoller	Summary placeholder for clause 3.9.3
3.10.1	Clause 3.10.1 Top Manacdoller	Summary placeholder for clause 3.10.1
3.10.2	Clause 3.10.2 Top Manacdoller	Summary placeholder for clause 3.10.2
3.11.1	Clause 3.11.1 Top Manacdoller	Summary placeholder for clause 3.11.1
3.11.2	Clause 3.11.2 Top Manacdoller	Summary placeholder for clause 3.11.2
3.11.3	Clause 3.11.3 Top Manacdoller	Summary placeholder for clause 3.11.3
4.1.1	Clause 4.1.1 Top Manacdoller	Summary placeholder for clause 4.1.1
4.1.2	Clause 4.1.2 Top Manacdoller	Summary placeholder for clause 4.1.2
4.1.3	Clause 4.1.3 Top Manacdoller	Summary placeholder for clause 4.1.3
4.2.1	Clause 4.2.1 Top Manacdoller	Summary placeholder for clause 4.2.1
4.2.2	Clause 4.2.2 Top Manacdoller	Summary placeholder for clause 4.2.2
4.2.3	Clause 4.2.3 Top Manacdoller	Summary placeholder for clause 4.2.3
4.3.1	Clause 4.3.1 Top Manacdoller	Summary placeholder for clause 4.3.1
4.3.2	Clause 4.3.2 Top Manacdoller	Summary placeholder for clause 4.3.2
4.3.3	Clause 4.3.3 Top Manacdoller	Summary placeholder for clause 4.3.3
4.3.4	Clause 4.3.4 Top Manacdoller	Summary placeholder for clause 4.3.4
4.3.5	Clause 4.3.5 Top Manacdoller	Summary placeholder for clause 4.3.5
4.3.6	Clause 4.3.6 Top Manacdoller	Summary placeholder for clause 4.3.6
4.4.1	Clause 4.4.1 Top Manacdoller	Summary placeholder for clause 4.4.1
4.4.2	Clause 4.4.2 Top Manacdoller	Summary placeholder for clause 4.4.2
4.4.3	Clause 4.4.3 Top Manacdoller	Summary placeholder for clause 4.4.3
4.4.4	Clause 4.4.4 Top Manacdoller	Summary placeholder for clause 4.4.4
4.4.5	Clause 4.4.5 Top Manacdoller	Summary placeholder for clause 4.4.5
4.4.6	Clause 4.4.6 Top Manacdoller	Summary placeholder for clause 4.4.6
4.4.7	Clause 4.4.7 Top Manacdoller	Summary placeholder for clause 4.4.7
4.5.1	Clause 4.5.1 Top Manacdoller	Summary placeholder for clause 4.5.1
4.5.2	Clause 4.5.2 Top Manacdoller	Summary placeholder for clause 4.5.2
4.6.1	Clause 4.6.1 Top Manacdoller	Summary placeholder for clause 4.6.1
4.6.2	Clause 4.6.2 Top Manacdoller	Summary placeholder for clause 4.6.2
4.7.1	Clause 4.7.1 Top Manacdoller	Summary placeholder for clause 4.7.1
4.7.2	Clause 4.7.2 Top Manacdoller	Summary placeholder for clause 4.7.2
4.7.3	Clause 4.7.3 Top Manacdoller	Summary placeholder for clause 4.7.3
4.8.1	Clause 4.8.1 Top Manacdoller	Summary placeholder for clause 4.8.1
4.8.2	Clause 4.8.2 Top Manacdoller	Summary placeholder for clause 4.8.2
4.8.3	Clause 4.8.3 Top Manacdoller	Summary placeholder for clause 4.8.3
4.9.1	Clause 4.9.1 Top Manacdoller	Summary placeholder for clause 4.9.1
4.9.2	Clause 4.9.2 Top Manacdoller	Summary placeholder for clause 4.9.2
4.9.3	Clause 4.9.3 Top Manacdoller	Summary placeholder for clause 4.9.3
4.9.4	Clause 4.9.4 Top Manacdoller	Summary placeholder for clause 4.9.4
4.10.1	Clause 4.10.1 Top Manacdoller	Summary placeholder for clause 4.10.1
4.10.2	Clause 4.10.2 Top Manacdoller	Summary placeholder for clause 4.10.2
4.10.3	Clause 4.10.3 Top Manacdoller	Summary placeholder for clause 4.10.3
4.10.4	Clause 4.10.4 Top Manacdoller	Summary placeholder for clause 4.10.4
4.11.1	Clause 4.11.1 Top Manacdoller	Summary placeholder for clause 4.11.1
4.11.2	Clause 4.11.2 Top Manacdoller	Summary placeholder for clause 4.11.2
4.11.3	Clause 4.11.3 Top Manacdoller	Summary placeholder for clause 4.11.3
4.11.4	Clause 4.11.4 Top Manacdoller	Summary placeholder for clause 4.11.4
4.11.5	Clause 4.11.5 Top Manacdoller	Summary placeholder for clause 4.11.5
4.12.1	Clause 4.12.1 Top Manacdoller	Summary placeholder for clause 4.12.1
4.12.2	Clause 4.12.2 Top Manacdoller	Summary placeholder for clause 4.12.2
4.12.3	Clause 4.12.3 Top Manacdoller	Summary placeholder for clause 4.12.3
4.13.1	Clause 4.13.1 Top Manacdoller	Summary placeholder for clause 4.13.1
4.13.2	Clause 4.13.2 Top Manacdoller	Summary placeholder for clause 4.13.2
4.13.3	Clause 4.13.3 Top Manacdoller	Summary placeholder for clause 4.13.3
4.13.4	Clause 4.13.4 Top Manacdoller	Summary placeholder for clause 4.13.4
4.14.1	Clause 4.14.1 Top Manacdoller	Summary placeholder for clause 4.14.1
4.14.2	Clause 4.14.2 Top Manacdoller	Summary placeholder for clause 4.14.2
4.14.3	Clause 4.14.3 Top Manacdoller	Summary placeholder for clause 4.14.3
4.15.1	Clause 4.15.1 Top Manacdoller	Summary placeholder for clause 4.15.1
4.15.2	Clause 4.15.2 Top Manacdoller	Summary placeholder for clause 4.15.2
4.15.3	Clause 4.15.3 Top Manacdoller	Summary placeholder for clause 4.15.3
4.15.4	Clause 4.15.4 Top Manacdoller	Summary placeholder for clause 4.15.4
4.16.1	Clause 4.16.1 Top Manacdoller	Summary placeholder for clause 4.16.1
4.16.2	Clause 4.16.2 Top Manacdoller	Summary placeholder for clause 4.16.2
5.1.1	Clause 5.1.1 Top Manacdoller	Summary placeholder for clause 5.1.1
5.1.2	Clause 5.1.2 Top Manacdoller	Summary placeholder for clause 5.1.2
5.1.3	Clause 5.1.3 Top Manacdoller	Summary placeholder for clause 5.1.3
5.1.4	Clause 5.1.4 Top Manacdoller	Summary placeholder for clause 5.1.4
5.2.1	Clause 5.2.1 Top Manacdoller	Summary placeholder for clause 5.2.1
5.2.2	Clause 5.2.2 Top Manacdoller	Summary placeholder for clause 5.2.2
5.2.3	Clause 5.2.3 Top Manacdoller	Summary placeholder for clause 5.2.3
5.2.4	Clause 5.2.4 Top Manacdoller	Summary placeholder for clause 5.2.4
5.3.1	Clause 5.3.1 Top Manacdoller	Summary placeholder for clause 5.3.1
5.3.2	Clause 5.3.2 Top Manacdoller	Summary placeholder for clause 5.3.2
5.3.3	Clause 5.3.3 Top Manacdoller	Summary placeholder for clause 5.3.3
5.3.4	Clause 5.3.4 Top Manacdoller	Summary placeholder for clause 5.3.4
5.4.1	Clause 5.4.1 Top Manacdoller	Summary placeholder for clause 5.4.1
5.4.2	Clause 5.4.2 Top Manacdoller	Summary placeholder for clause 5.4.2
5.5.1	Clause 5.5.1 Top Manacdoller	Summary placeholder for clause 5.5.1
5.5.2	Clause 5.5.2 Top Manacdoller	Summary placeholder for clause 5.5.2
5.5.3	Clause 5.5.3 Top Manacdoller	Summary placeholder for clause 5.5.3
5.6.1	Clause 5.6.1 Top Manacdoller	Summary placeholder for clause 5.6.1
5.6.2	Clause 5.6.2 Top Manacdoller	Summary placeholder for clause 5.6.2
5.6.3	Clause 5.6.3 Top Manacdoller	Summary placeholder for clause 5.6.3
5.7.1	Clause 5.7.1 Top Manacdoller	Summary placeholder for clause 5.7.1
5.7.2	Clause 5.7.2 Top Manacdoller	Summary placeholder for clause 5.7.2
5.8.1	Clause 5.8.1 Top Manacdoller	Summary placeholder for clause 5.8.1
5.8.2	Clause 5.8.2 Top Manacdoller	Summary placeholder for clause 5.8.2
6.1.1	Clause 6.1.1 Top Manacdoller	Summary placeholder for clause 6.1.1
6.1.2	Clause 6.1.2 Top Manacdoller	Summary placeholder for clause 6.1.2
6.1.3	Clause 6.1.3 Top Manacdoller	Summary placeholder for clause 6.1.3
6.1.4	Clause 6.1.4 Top Manacdoller	Summary placeholder for clause 6.1.4
6.1.5	Clause 6.1.5 Top Manacdoller	Summary placeholder for clause 6.1.5
6.2.1	Clause 6.2.1 Top Manacdoller	Summary placeholder for clause 6.2.1
6.2.2	Clause 6.2.2 Top Manacdoller	Summary placeholder for clause 6.2.2
6.2.3	Clause 6.2.3 Top Manacdoller	Summary placeholder for clause 6.2.3
6.3.1	Clause 6.3.1 Top Manacdoller	Summary placeholder for clause 6.3.1
6.3.2	Clause 6.3.2 Top Manacdoller	Summary placeholder for clause 6.3.2
6.4.1	Clause 6.4.1 Top Manacdoller	Summary placeholder for clause 6.4.1
6.4.2	Clause 6.4.2 Top Manacdoller	Summary placeholder for clause 6.4.2
6.4.3	Clause 6.4.3 Top Manacdoller	Summary placeholder for clause 6.4.3
6.4.4	Clause 6.4.4 Top Manacdoller	Summary placeholder for clause 6.4.4
7.1.1	Clause 7.1.1 Top Manacdoller	Summary placeholder for clause 7.1.1
7.1.2	Clause 7.1.2 Top Manacdoller	Summary placeholder for clause 7.1.2
7.1.3	Clause 7.1.3 Top Manacdoller	Summary placeholder for clause 7.1.3
7.1.4	Clause 7.1.4 Top Manacdoller	Summary placeholder for clause 7.1.4
7.2.1	Clause 7.2.1 Top Manacdoller	Summary placeholder for clause 7.2.1
7.2.2	Clause 7.2.2 Top Manacdoller	Summary placeholder for clause 7.2.2
7.2.3	Clause 7.2.3 Top Manacdoller	Summary placeholder for clause 7.2.3
7.2.4	Clause 7.2.4 Top Manacdoller	Summary placeholder for clause 7.2.4
7.3.1	Clause 7.3.1 Top Manacdoller	Summary placeholder for clause 7.3.1
7.3.2	Clause 7.3.2 Top Manacdoller	Summary placeholder for clause 7.3.2
7.4.1	Clause 7.4.1 Top Manacdoller	Summary placeholder for clause 7.4.1
7.4.2	Clause 7.4.2 Top Manacdoller	Summary placeholder for clause 7.4.2
7.5.1	Clause 7.5.1 Top Manacdoller	Summary placeholder for clause 7.5.1
7.5.2	Clause 7.5.2 Top Manacdoller	Summary placeholder for clause 7.5.2
8.1.1	Clause 8.1.1 Top Manacdoller	Summary placeholder for clause 8.1.1
8.1.2	Clause 8.1.2 Top Manacdoller	Summary placeholder for clause 8.1.2
8.2.1	Clause 8.2.1 Top Manacdoller	Summary placeholder for clause 8.2.1
8.2.2	Clause 8.2.2 Top Manacdoller	Summary placeholder for clause 8.2.2
8.3.1	Clause 8.3.1 Top Manacdoller	Summary placeholder for clause 8.3.1
8.3.2	Clause 8.3.2 Top Manacdoller	Summary placeholder for clause 8.3.2
8.4.1	Clause 8.4.1 Top Manacdoller	Summary placeholder for clause 8.4.1
8.4.2	Clause 8.4.2 Top Manacdoller	Summary placeholder for clause 8.4.2
9.1.1	Clause 9.1.1 Top Manacdoller	Summary placeholder for clause 9.1.1
9.1.2	Clause 9.1.2 Top Manacdoller	Summary placeholder for clause 9.1.2
9.1.3	Clause 9.1.3 Top Manacdoller	Summary placeholder for clause 9.1.3
9.2.1	Clause 9.2.1 Top Manacdoller	Summary placeholder for clause 9.2.1
9.2.2	Clause 9.2.2 Top Manacdoller	Summary placeholder for clause 9.2.2
9.3.1	Clause 9.3.1 Top Manacdoller	Summary placeholder for clause 9.3.1
9.3.2	Clause 9.3.2 Top Manacdoller	Summary placeholder for clause 9.3.2
9.4.1	Clause 9.4.1 Top Manacdoller	Summary placeholder for clause 9.4.1
9.4.2	Clause 9.4.2 Top Manacdoller	Summary placeholder for clause 9.4.2
9.4.3	Clause 9.4.3 Top Manacdoller	Summary placeholder for clause 9.4.3
9.5.1	Clause 9.5.1 Top Manacdoller	Summary placeholder for clause 9.5.1
9.5.2	Clause 9.5.2 Top Manacdoller	Summary placeholder for clause 9.5.2`;

async function importClauses() {
  console.log('Starting BRCGS Clause import...\n');

  // Get BRCGS standard ID
  const { data: standards, error: stdError } = await supabase
    .from('document_standard')
    .select('id, name')
    .ilike('name', '%BRCGS%')
    .limit(1);

  if (stdError) {
    console.error('Error fetching standard:', stdError);
    process.exit(1);
  }

  const brcgsStandard = standards && standards.length > 0 ? standards[0] : null;
  console.log('BRCGS Standard:', brcgsStandard ? brcgsStandard.name : 'Not found');

  // Get or create "Clause" document type
  let { data: docTypes, error: dtError } = await supabase
    .from('document_types')
    .select('id, name')
    .eq('name', 'Clause')
    .limit(1);

  let clauseTypeId = null;
  if (docTypes && docTypes.length > 0) {
    clauseTypeId = docTypes[0].id;
    console.log('Found existing Clause document type:', clauseTypeId);
  } else {
    // Create Clause document type
    const { data: newType, error: createError } = await supabase
      .from('document_types')
      .insert({ name: 'Clause' })
      .select()
      .single();

    if (createError) {
      console.error('Error creating Clause document type:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
      process.exit(1);
    }
    clauseTypeId = newType.id;
    console.log('Created Clause document type:', clauseTypeId);
  }

  // Parse clauses
  const lines = clauseData.trim().split('\n');
  const clauses = lines.map(line => {
    const [code, title, summary] = line.split('\t');
    return { code: code.trim(), title: title.trim(), summary: summary.trim() };
  });

  console.log(`\nParsed ${clauses.length} clauses\n`);

  // Get all sections to match clauses
  const { data: sections, error: secError } = await supabase
    .from('standard_sections')
    .select('id, code, title, standard_id');

  if (secError) {
    console.error('Error fetching sections:', secError);
    process.exit(1);
  }

  console.log(`Found ${sections.length} sections in database\n`);

  // Match clauses to sections and prepare documents
  const documentsToInsert = [];
  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const clause of clauses) {
    // Find matching section by code
    const matchingSection = sections.find(s => s.code === clause.code);

    if (matchingSection) {
      matchedCount++;
      documentsToInsert.push({
        title: clause.title,
        reference_code: clause.code,
        notes: clause.summary,
        document_type_id: clauseTypeId,
        section_id: matchingSection.id,
        current_version: 1,
        archived: false,
        created_at: new Date().toISOString()
      });
    } else {
      unmatchedCount++;
      console.log(`⚠️  No section found for clause: ${clause.code}`);
    }
  }

  console.log(`\nMatched: ${matchedCount} clauses`);
  console.log(`Unmatched: ${unmatchedCount} clauses\n`);

  if (documentsToInsert.length === 0) {
    console.log('No documents to insert. Please create sections first.');
    return;
  }

  // Insert documents in batches
  const batchSize = 50;
  let inserted = 0;
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
      inserted += data.length;
      console.log(`✓ Inserted batch ${i / batchSize + 1}: ${data.length} documents`);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Successfully inserted: ${inserted} documents`);
  console.log(`Errors: ${errors}`);
  console.log(`Total clauses processed: ${clauses.length}`);
}

importClauses().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
