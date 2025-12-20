import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igzucjhzvghlhpqmgolb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnenVjamh6dmdobGhwcW1nb2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjE5MzEsImV4cCI6MjA0NjM5NzkzMX0.HWf0nzU_N7rhOIXWfQd1U0xhIZYC7SqVsUIc_aWVhgw';

const supabase = createClient(supabaseUrl, supabaseKey);

const refCodeMappings = [
  { pattern: ['policy', 'policies'], code: 'PO' },
  { pattern: ['procedure', 'procedures'], code: 'PR' },
  { pattern: ['sop', 'standard operating procedure'], code: 'SO' },
  { pattern: ['work instruction', 'wi'], code: 'WI' },
  { pattern: ['form', 'forms'], code: 'FM' },
  { pattern: ['guide', 'guidance'], code: 'GD' },
  { pattern: ['checklist'], code: 'CL' },
  { pattern: ['template'], code: 'TP' },
  { pattern: ['manual'], code: 'MN' },
  { pattern: ['specification'], code: 'SP' },
  { pattern: ['standard'], code: 'ST' },
  { pattern: ['plan'], code: 'PL' },
  { pattern: ['report'], code: 'RP' },
  { pattern: ['record'], code: 'RC' },
  { pattern: ['assessment'], code: 'AS' },
  { pattern: ['audit'], code: 'AU' },
  { pattern: ['training'], code: 'TR' },
  { pattern: ['certificate'], code: 'CT' },
  { pattern: ['notice', 'notification'], code: 'NT' },
  { pattern: ['ssow', 'safe system of work'], code: 'SSOW' },
];

async function populateDocumentTypeRefCodes() {
  console.log('📝 Fetching document types...');

  const { data: docTypes, error } = await supabase
    .from('document_types')
    .select('id, name, ref_code');

  if (error) {
    console.error('❌ Error fetching document types:', error);
    return;
  }

  console.log(`Found ${docTypes.length} document types\n`);

  for (const docType of docTypes) {
    if (docType.ref_code) {
      console.log(`✓ ${docType.name} already has ref_code: ${docType.ref_code}`);
      continue;
    }

    const nameLower = docType.name.toLowerCase();
    let refCode = null;

    // Find matching ref code
    for (const mapping of refCodeMappings) {
      if (mapping.pattern.some(p => nameLower.includes(p))) {
        refCode = mapping.code;
        break;
      }
    }

    // If no match, use first 2 letters
    if (!refCode) {
      refCode = docType.name.substring(0, 2).toUpperCase();
    }

    // Update the document type
    const { error: updateError } = await supabase
      .from('document_types')
      .update({ ref_code: refCode })
      .eq('id', docType.id);

    if (updateError) {
      console.error(`❌ Error updating ${docType.name}:`, updateError);
    } else {
      console.log(`✅ ${docType.name} → ${refCode}`);
    }
  }

  console.log('\n✅ Document type ref codes populated!');
}

async function populateSectionRefCodes() {
  console.log('\n📝 Fetching sections...');

  const { data: sections, error } = await supabase
    .from('standard_sections')
    .select('id, code, title, ref_code');

  if (error) {
    console.error('❌ Error fetching sections:', error);
    return;
  }

  console.log(`Found ${sections.length} sections\n`);

  for (const section of sections) {
    if (section.ref_code) {
      console.log(`✓ ${section.code} (${section.title}) already has ref_code: ${section.ref_code}`);
      continue;
    }

    let refCode;

    // If code is purely numeric, pad with leading zero
    if (/^\d+$/.test(section.code)) {
      refCode = section.code.padStart(2, '0');
    }
    // If code has decimal (like "1.1"), take first part and pad
    else if (/^\d+\./.test(section.code)) {
      const firstPart = section.code.split('.')[0];
      refCode = firstPart.padStart(2, '0');
    }
    // Otherwise use first 2 characters uppercase
    else {
      refCode = section.code.substring(0, 2).toUpperCase();
    }

    // Update the section
    const { error: updateError } = await supabase
      .from('standard_sections')
      .update({ ref_code: refCode })
      .eq('id', section.id);

    if (updateError) {
      console.error(`❌ Error updating ${section.code}:`, updateError);
    } else {
      console.log(`✅ ${section.code} (${section.title}) → ${refCode}`);
    }
  }

  console.log('\n✅ Section ref codes populated!');
}

// Run both
await populateDocumentTypeRefCodes();
await populateSectionRefCodes();

console.log('\n🎉 All done! Refresh your page to see the changes.');
