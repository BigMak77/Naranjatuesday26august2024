#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking for duplicate sections...\n');

  const { data: standards } = await supabase
    .from('document_standard')
    .select('id, name')
    .or('name.ilike.%BRCGS%,name.ilike.%BRC%,name.ilike.%Food Safety%');

  if (!standards || standards.length === 0) {
    console.error('No BRCGS standard found');
    process.exit(1);
  }

  const standardId = standards[0].id;
  console.log(`Standard: ${standards[0].name}\n`);

  const { data: sections } = await supabase
    .from('standard_sections')
    .select('id, code, title, created_at')
    .eq('standard_id', standardId)
    .order('code')
    .order('created_at');

  if (!sections) {
    console.log('No sections found');
    return;
  }

  console.log(`Total sections: ${sections.length}\n`);

  // Group by code
  const grouped = {};
  sections.forEach(section => {
    if (!grouped[section.code]) {
      grouped[section.code] = [];
    }
    grouped[section.code].push(section);
  });

  // Find duplicates
  const duplicates = Object.entries(grouped).filter(([code, secs]) => secs.length > 1);

  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  console.log(`Found ${duplicates.length} codes with duplicates:\n`);

  duplicates.forEach(([code, secs]) => {
    console.log(`Code ${code} (${secs.length} entries):`);
    secs.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.title} (${s.id}) - ${new Date(s.created_at).toLocaleString()}`);
    });
    console.log('');
  });

  // Show total count
  const totalDuplicates = duplicates.reduce((sum, [, secs]) => sum + secs.length - 1, 0);
  console.log(`\nTotal duplicate entries to remove: ${totalDuplicates}`);
}

main().catch(console.error);
