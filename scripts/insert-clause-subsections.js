const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Helper function to get parent code from clause code
function getParentCode(code) {
  // 1.1.1 -> 1.1, 2.13.4 -> 2.13
  const parts = code.split('.');
  if (parts.length === 3) {
    return `${parts[0]}.${parts[1]}`;
  }
  return null;
}

async function importSubsections() {
  console.log('=== BRCGS Clause Subsections Import ===\n');

  // Get BRCGS standard
  const { data: standards } = await supabase
    .from('document_standard')
    .select('id, name')
    .ilike('name', '%BRCGS%')
    .limit(1);

  const brcgsStandard = standards && standards[0];
  if (!brcgsStandard) {
    console.error('BRCGS standard not found');
    process.exit(1);
  }

  console.log(`✓ BRCGS Standard: ${brcgsStandard.name}\n`);

  // Get Clause document type
  let { data: docTypes } = await supabase
    .from('document_types')
    .select('id')
    .eq('name', 'Clause')
    .limit(1);

  const clauseTypeId = docTypes && docTypes[0] ? docTypes[0].id : null;
  console.log(`✓ Clause type ID: ${clauseTypeId}\n`);

  // Get all existing sections
  const { data: existingSections } = await supabase
    .from('standard_sections')
    .select('id, code, standard_id');

  const sectionMap = {};
  existingSections.forEach(s => {
    sectionMap[s.code] = s.id;
  });

  console.log(`✓ Loaded ${existingSections.length} existing sections\n`);

  // Parse clauses
  const lines = clauseData.trim().split('\n');
  const clauses = lines.map(line => {
    const [code, title, summary] = line.split('\t');
    return { code: code.trim(), title: title.trim(), summary: summary.trim() };
  });

  console.log(`Parsed ${clauses.length} clauses\n`);
  console.log('Creating child sections...\n');

  // Create child sections with parent references
  const sectionsToInsert = [];
  const clausesToDoc = [];

  for (const clause of clauses) {
    const parentCode = getParentCode(clause.code);
    const parentId = sectionMap[parentCode];

    if (parentId) {
      sectionsToInsert.push({
        code: clause.code,
        title: clause.title,
        description: clause.summary,
        standard_id: brcgsStandard.id,
        parent_section_id: parentId
      });
      clausesToDoc.push(clause);
    } else {
      console.log(`⚠️  No parent found for ${clause.code} (parent: ${parentCode})`);
    }
  }

  console.log(`Will insert ${sectionsToInsert.length} child sections\n`);

  // Insert sections in batches
  const batchSize = 50;
  let insertedSections = 0;
  const newSectionIds = {};

  for (let i = 0; i < sectionsToInsert.length; i += batchSize) {
    const batch = sectionsToInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('standard_sections')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      insertedSections += data.length;
      data.forEach(s => {
        newSectionIds[s.code] = s.id;
      });
      console.log(`✓ Inserted section batch ${i / batchSize + 1}: ${data.length} sections`);
    }
  }

  console.log(`\n✓ Inserted ${insertedSections} child sections\n`);
  console.log('Creating documents...\n');

  // Insert documents
  const documentsToInsert = clausesToDoc.map(clause => ({
    title: clause.title,
    reference_code: clause.code,
    notes: clause.summary,
    document_type_id: clauseTypeId,
    section_id: newSectionIds[clause.code],
    current_version: 1,
    archived: false,
    created_at: new Date().toISOString()
  }));

  let insertedDocuments = 0;

  for (let i = 0; i < documentsToInsert.length; i += batchSize) {
    const batch = documentsToInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('documents')
      .insert(batch)
      .select();

    if (error) {
      console.error(`Error inserting documents batch ${i / batchSize + 1}:`, error.message);
    } else {
      insertedDocuments += data.length;
      console.log(`✓ Inserted document batch ${i / batchSize + 1}: ${data.length} documents`);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`✓ Child sections inserted: ${insertedSections}`);
  console.log(`✓ Documents inserted: ${insertedDocuments}`);
}

importSubsections().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
