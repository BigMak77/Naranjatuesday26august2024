-- Insert BRCGS Food Safety standard sections
-- This script will automatically find or create the standard and insert all sections

DO $$
DECLARE
  v_standard_id uuid;
  v_section_title_prefix text;
BEGIN
  -- First, try to find an existing BRCGS or Food Safety standard
  SELECT id INTO v_standard_id
  FROM document_standards
  WHERE name ILIKE '%BRCGS%'
     OR name ILIKE '%Food Safety%'
     OR name ILIKE '%BRC%'
  LIMIT 1;

  -- If no standard found, you'll need to create one first or set the ID manually
  IF v_standard_id IS NULL THEN
    RAISE NOTICE 'No BRCGS/Food Safety standard found. Please create one first or update this script with the correct standard_id.';
    RAISE NOTICE 'Run: SELECT id, name FROM document_standards; to see available standards.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using standard_id: %', v_standard_id;

  -- Insert all sections
  INSERT INTO standard_sections (code, title, description, standard_id, parent_section_id) VALUES
  -- Senior Management Commitment
  ('1.1', 'Senior management commitment and continual improvement', '', v_standard_id, NULL),
  ('1.2', 'Organisational structure, responsibilities and management authority', '', v_standard_id, NULL),

  -- The Food Safety Plan - HACCP
  ('2.1', 'HACCP food safety team', '', v_standard_id, NULL),
  ('2.2', 'Prerequisite programmes', '', v_standard_id, NULL),
  ('2.3', 'Describe the product', '', v_standard_id, NULL),
  ('2.4', 'Identify intended use', '', v_standard_id, NULL),
  ('2.5', 'Construct a process flow diagram', '', v_standard_id, NULL),
  ('2.6', 'Verify process flow diagram', '', v_standard_id, NULL),
  ('2.7', 'List all potential hazards and conduct hazard analysis', '', v_standard_id, NULL),
  ('2.8', 'Determine CCPs', '', v_standard_id, NULL),
  ('2.9', 'Establish validated critical limits for each CCP', '', v_standard_id, NULL),
  ('2.10', 'Establish a monitoring system for each CCP', '', v_standard_id, NULL),
  ('2.11', 'Establish a corrective action plan', '', v_standard_id, NULL),
  ('2.12', 'Validate and verify the HACCP plan', '', v_standard_id, NULL),
  ('2.13', 'HACCP documentation and record-keeping', '', v_standard_id, NULL),

  -- Food Safety and Quality Management System
  ('3.1', 'Food safety and quality manual', '', v_standard_id, NULL),
  ('3.2', 'Document control', '', v_standard_id, NULL),
  ('3.3', 'Record completion and maintenance', '', v_standard_id, NULL),
  ('3.4', 'Internal audits', '', v_standard_id, NULL),
  ('3.5', 'Supplier and raw material approval and performance monitoring', '', v_standard_id, NULL),
  ('3.6', 'Specifications', '', v_standard_id, NULL),
  ('3.7', 'Corrective and preventive actions', '', v_standard_id, NULL),
  ('3.8', 'Control of non-conforming product', '', v_standard_id, NULL),
  ('3.9', 'Traceability', '', v_standard_id, NULL),
  ('3.10', 'Complaint-handling', '', v_standard_id, NULL),
  ('3.11', 'Management of incidents, product withdrawal and recall', '', v_standard_id, NULL),

  -- Site Standards
  ('4.1', 'External standards', '', v_standard_id, NULL),
  ('4.2', 'Site security and food defence', '', v_standard_id, NULL),
  ('4.3', 'Layout, product flow and segregation', '', v_standard_id, NULL),
  ('4.4', 'Building fabric and utilities', '', v_standard_id, NULL),
  ('4.5', 'Equipment and maintenance', '', v_standard_id, NULL),
  ('4.6', 'Waste and pest control', '', v_standard_id, NULL),
  ('4.7', 'Cleaning and hygiene', '', v_standard_id, NULL),
  ('4.8', 'Chemical and glass/brittle material control', '', v_standard_id, NULL),
  ('4.9', 'Foreign body detection and prevention', '', v_standard_id, NULL),
  ('4.11', 'Housekeeping and environmental monitoring', '', v_standard_id, NULL),

  -- Product Control
  ('5.1', 'Product design and development', '', v_standard_id, NULL),
  ('5.2', 'Product labelling and pack control', '', v_standard_id, NULL),
  ('5.3', 'Management of allergens', '', v_standard_id, NULL),
  ('5.4', 'Product authenticity, claims and chain of custody', '', v_standard_id, NULL),
  ('5.5', 'Product inspection, testing and release', '', v_standard_id, NULL),
  ('5.6', 'Control of measuring and monitoring devices', '', v_standard_id, NULL),

  -- Process Control
  ('6.1', 'Control of operations', '', v_standard_id, NULL),
  ('6.2', 'Equipment calibration and maintenance', '', v_standard_id, NULL),
  ('6.3', 'Quantity, weight and volume control', '', v_standard_id, NULL),
  ('6.4', 'Packaging control', '', v_standard_id, NULL),
  ('6.5', 'Start-up, changeover and shut-down procedures', '', v_standard_id, NULL),

  -- Personnel
  ('7.1', 'Training and competence', '', v_standard_id, NULL),
  ('7.2', 'Personal hygiene', '', v_standard_id, NULL),
  ('7.3', 'Protective clothing', '', v_standard_id, NULL),
  ('7.4', 'Medical screening and fitness to work', '', v_standard_id, NULL),
  ('7.5', 'Staff facilities and welfare', '', v_standard_id, NULL),
  ('7.6', 'Visitors and contractors', '', v_standard_id, NULL),

  -- Production Risk Zones
  ('8.1', 'Zoning and segregation', '', v_standard_id, NULL),
  ('8.2', 'Premises, equipment and people flow', '', v_standard_id, NULL),
  ('8.3', 'Environmental monitoring and cleaning validation', '', v_standard_id, NULL),
  ('8.4', 'Temperature, humidity and air-handling controls', '', v_standard_id, NULL),

  -- Requirements for Traded Products
  ('9.1', 'Approval and performance monitoring of manufacturers/packers', '', v_standard_id, NULL),
  ('9.2', 'Product specifications and traceability', '', v_standard_id, NULL),
  ('9.3', 'Product inspection and release', '', v_standard_id, NULL),
  ('9.4', 'Product authenticity, claims and chain of custody', '', v_standard_id, NULL)

  ON CONFLICT (code, standard_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  RAISE NOTICE 'Successfully inserted/updated % sections', 63;
END $$;
