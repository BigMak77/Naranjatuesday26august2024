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

const sections = [
  // Senior Management Commitment
  { section_title: 'Senior Management Commitment', code: '1.1', title: 'Senior management commitment and continual improvement' },
  { section_title: 'Senior Management Commitment', code: '1.2', title: 'Organisational structure, responsibilities and management authority' },

  // The Food Safety Plan - HACCP
  { section_title: 'The Food Safety Plan - HACCP', code: '2.1', title: 'HACCP food safety team' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.2', title: 'Prerequisite programmes' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.3', title: 'Describe the product' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.4', title: 'Identify intended use' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.5', title: 'Construct a process flow diagram' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.6', title: 'Verify process flow diagram' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.7', title: 'List all potential hazards and conduct hazard analysis' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.8', title: 'Determine CCPs' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.9', title: 'Establish validated critical limits for each CCP' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.10', title: 'Establish a monitoring system for each CCP' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.11', title: 'Establish a corrective action plan' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.12', title: 'Validate and verify the HACCP plan' },
  { section_title: 'The Food Safety Plan - HACCP', code: '2.13', title: 'HACCP documentation and record-keeping' },

  // Food Safety and Quality Management System
  { section_title: 'Food Safety and Quality Management System', code: '3.1', title: 'Food safety and quality manual' },
  { section_title: 'Food Safety and Quality Management System', code: '3.2', title: 'Document control' },
  { section_title: 'Food Safety and Quality Management System', code: '3.3', title: 'Record completion and maintenance' },
  { section_title: 'Food Safety and Quality Management System', code: '3.4', title: 'Internal audits' },
  { section_title: 'Food Safety and Quality Management System', code: '3.5', title: 'Supplier and raw material approval and performance monitoring' },
  { section_title: 'Food Safety and Quality Management System', code: '3.6', title: 'Specifications' },
  { section_title: 'Food Safety and Quality Management System', code: '3.7', title: 'Corrective and preventive actions' },
  { section_title: 'Food Safety and Quality Management System', code: '3.8', title: 'Control of non-conforming product' },
  { section_title: 'Food Safety and Quality Management System', code: '3.9', title: 'Traceability' },
  { section_title: 'Food Safety and Quality Management System', code: '3.10', title: 'Complaint-handling' },
  { section_title: 'Food Safety and Quality Management System', code: '3.11', title: 'Management of incidents, product withdrawal and recall' },

  // Site Standards
  { section_title: 'Site Standards', code: '4.1', title: 'External standards' },
  { section_title: 'Site Standards', code: '4.2', title: 'Site security and food defence' },
  { section_title: 'Site Standards', code: '4.3', title: 'Layout, product flow and segregation' },
  { section_title: 'Site Standards', code: '4.4', title: 'Building fabric and utilities' },
  { section_title: 'Site Standards', code: '4.5', title: 'Equipment and maintenance' },
  { section_title: 'Site Standards', code: '4.6', title: 'Waste and pest control' },
  { section_title: 'Site Standards', code: '4.7', title: 'Cleaning and hygiene' },
  { section_title: 'Site Standards', code: '4.8', title: 'Chemical and glass/brittle material control' },
  { section_title: 'Site Standards', code: '4.9', title: 'Foreign body detection and prevention' },
  { section_title: 'Site Standards', code: '4.11', title: 'Housekeeping and environmental monitoring' },

  // Product Control
  { section_title: 'Product Control', code: '5.1', title: 'Product design and development' },
  { section_title: 'Product Control', code: '5.2', title: 'Product labelling and pack control' },
  { section_title: 'Product Control', code: '5.3', title: 'Management of allergens' },
  { section_title: 'Product Control', code: '5.4', title: 'Product authenticity, claims and chain of custody' },
  { section_title: 'Product Control', code: '5.5', title: 'Product inspection, testing and release' },
  { section_title: 'Product Control', code: '5.6', title: 'Control of measuring and monitoring devices' },

  // Process Control
  { section_title: 'Process Control', code: '6.1', title: 'Control of operations' },
  { section_title: 'Process Control', code: '6.2', title: 'Equipment calibration and maintenance' },
  { section_title: 'Process Control', code: '6.3', title: 'Quantity, weight and volume control' },
  { section_title: 'Process Control', code: '6.4', title: 'Packaging control' },
  { section_title: 'Process Control', code: '6.5', title: 'Start-up, changeover and shut-down procedures' },

  // Personnel
  { section_title: 'Personnel', code: '7.1', title: 'Training and competence' },
  { section_title: 'Personnel', code: '7.2', title: 'Personal hygiene' },
  { section_title: 'Personnel', code: '7.3', title: 'Protective clothing' },
  { section_title: 'Personnel', code: '7.4', title: 'Medical screening and fitness to work' },
  { section_title: 'Personnel', code: '7.5', title: 'Staff facilities and welfare' },
  { section_title: 'Personnel', code: '7.6', title: 'Visitors and contractors' },

  // Production Risk Zones
  { section_title: 'Production Risk Zones – High Risk, High Care and Ambient High Care', code: '8.1', title: 'Zoning and segregation' },
  { section_title: 'Production Risk Zones – High Risk, High Care and Ambient High Care', code: '8.2', title: 'Premises, equipment and people flow' },
  { section_title: 'Production Risk Zones – High Risk, High Care and Ambient High Care', code: '8.3', title: 'Environmental monitoring and cleaning validation' },
  { section_title: 'Production Risk Zones – High Risk, High Care and Ambient High Care', code: '8.4', title: 'Temperature, humidity and air-handling controls' },

  // Requirements for Traded Products
  { section_title: 'Requirements for Traded Products', code: '9.1', title: 'Approval and performance monitoring of manufacturers/packers' },
  { section_title: 'Requirements for Traded Products', code: '9.2', title: 'Product specifications and traceability' },
  { section_title: 'Requirements for Traded Products', code: '9.3', title: 'Product inspection and release' },
  { section_title: 'Requirements for Traded Products', code: '9.4', title: 'Product authenticity, claims and chain of custody' },
];

async function main() {
  console.log('Starting standard_sections update...\n');

  // First, check if we have a document standard
  const { data: standards, error: standardsError } = await supabase
    .from('document_standard')
    .select('id, name')
    .or('name.ilike.%BRCGS%,name.ilike.%BRC%,name.ilike.%Food Safety%');

  if (standardsError) {
    console.error('Error fetching standards:', standardsError);
    process.exit(1);
  }

  console.log('Available standards:', standards);

  if (!standards || standards.length === 0) {
    console.error('\nNo BRCGS or Food Safety standard found.');
    console.log('Please create a document_standard first or update the search criteria.');

    // Show all standards
    const { data: allStandards } = await supabase
      .from('document_standard')
      .select('id, name');

    console.log('\nAll available standards:');
    allStandards?.forEach(s => console.log(`  - ${s.name} (${s.id})`));
    process.exit(1);
  }

  const standardId = standards[0].id;
  console.log(`\nUsing standard: ${standards[0].name} (${standardId})\n`);

  // First, check if we should clear existing sections
  console.log('Checking for existing sections...');
  const { data: existingSections } = await supabase
    .from('standard_sections')
    .select('id, code')
    .eq('standard_id', standardId);

  if (existingSections && existingSections.length > 0) {
    console.log(`Found ${existingSections.length} existing sections.`);
    console.log('Deleting existing sections to avoid duplicates...');

    const { error: deleteError } = await supabase
      .from('standard_sections')
      .delete()
      .eq('standard_id', standardId);

    if (deleteError) {
      console.error('Error deleting existing sections:', deleteError);
    } else {
      console.log('Existing sections deleted successfully.\n');
    }
  }

  // Insert sections
  let successCount = 0;
  let errorCount = 0;

  for (const section of sections) {
    const { data, error } = await supabase
      .from('standard_sections')
      .insert({
        code: section.code,
        title: section.title,
        description: '',
        standard_id: standardId,
        parent_section_id: null,
      });

    if (error) {
      console.error(`Error inserting ${section.code}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`✓ Inserted: ${section.code} - ${section.title}`);
      successCount++;
    }
  }

  console.log(`\n\nSummary:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${sections.length}`);
}

main().catch(console.error);
