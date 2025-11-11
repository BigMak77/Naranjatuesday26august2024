-- Update standard_sections table with BRCGS Food Safety standard sections
-- First, we need to get or create the BRCGS Food Safety standard
-- Assuming the standard already exists, we'll insert the sections

-- Delete existing sections (optional - comment out if you want to keep existing data)
-- DELETE FROM standard_sections WHERE standard_id IN (SELECT id FROM document_standards WHERE name LIKE '%BRCGS%' OR name LIKE '%Food Safety%');

-- Insert standard sections
-- Note: You'll need to replace 'YOUR_STANDARD_ID_HERE' with the actual UUID from your document_standards table
-- Run this first to get the ID: SELECT id, name FROM document_standards;

INSERT INTO standard_sections (code, title, description, standard_id) VALUES
-- Senior Management Commitment
('1.1', 'Senior management commitment and continual improvement', '', 'YOUR_STANDARD_ID_HERE'),
('1.2', 'Organisational structure, responsibilities and management authority', '', 'YOUR_STANDARD_ID_HERE'),

-- The Food Safety Plan - HACCP
('2.1', 'HACCP food safety team', '', 'YOUR_STANDARD_ID_HERE'),
('2.2', 'Prerequisite programmes', '', 'YOUR_STANDARD_ID_HERE'),
('2.3', 'Describe the product', '', 'YOUR_STANDARD_ID_HERE'),
('2.4', 'Identify intended use', '', 'YOUR_STANDARD_ID_HERE'),
('2.5', 'Construct a process flow diagram', '', 'YOUR_STANDARD_ID_HERE'),
('2.6', 'Verify process flow diagram', '', 'YOUR_STANDARD_ID_HERE'),
('2.7', 'List all potential hazards and conduct hazard analysis', '', 'YOUR_STANDARD_ID_HERE'),
('2.8', 'Determine CCPs', '', 'YOUR_STANDARD_ID_HERE'),
('2.9', 'Establish validated critical limits for each CCP', '', 'YOUR_STANDARD_ID_HERE'),
('2.10', 'Establish a monitoring system for each CCP', '', 'YOUR_STANDARD_ID_HERE'),
('2.11', 'Establish a corrective action plan', '', 'YOUR_STANDARD_ID_HERE'),
('2.12', 'Validate and verify the HACCP plan', '', 'YOUR_STANDARD_ID_HERE'),
('2.13', 'HACCP documentation and record-keeping', '', 'YOUR_STANDARD_ID_HERE'),

-- Food Safety and Quality Management System
('3.1', 'Food safety and quality manual', '', 'YOUR_STANDARD_ID_HERE'),
('3.2', 'Document control', '', 'YOUR_STANDARD_ID_HERE'),
('3.3', 'Record completion and maintenance', '', 'YOUR_STANDARD_ID_HERE'),
('3.4', 'Internal audits', '', 'YOUR_STANDARD_ID_HERE'),
('3.5', 'Supplier and raw material approval and performance monitoring', '', 'YOUR_STANDARD_ID_HERE'),
('3.6', 'Specifications', '', 'YOUR_STANDARD_ID_HERE'),
('3.7', 'Corrective and preventive actions', '', 'YOUR_STANDARD_ID_HERE'),
('3.8', 'Control of non-conforming product', '', 'YOUR_STANDARD_ID_HERE'),
('3.9', 'Traceability', '', 'YOUR_STANDARD_ID_HERE'),
('3.10', 'Complaint-handling', '', 'YOUR_STANDARD_ID_HERE'),
('3.11', 'Management of incidents, product withdrawal and recall', '', 'YOUR_STANDARD_ID_HERE'),

-- Site Standards
('4.1', 'External standards', '', 'YOUR_STANDARD_ID_HERE'),
('4.2', 'Site security and food defence', '', 'YOUR_STANDARD_ID_HERE'),
('4.3', 'Layout, product flow and segregation', '', 'YOUR_STANDARD_ID_HERE'),
('4.4', 'Building fabric and utilities', '', 'YOUR_STANDARD_ID_HERE'),
('4.5', 'Equipment and maintenance', '', 'YOUR_STANDARD_ID_HERE'),
('4.6', 'Waste and pest control', '', 'YOUR_STANDARD_ID_HERE'),
('4.7', 'Cleaning and hygiene', '', 'YOUR_STANDARD_ID_HERE'),
('4.8', 'Chemical and glass/brittle material control', '', 'YOUR_STANDARD_ID_HERE'),
('4.9', 'Foreign body detection and prevention', '', 'YOUR_STANDARD_ID_HERE'),
('4.11', 'Housekeeping and environmental monitoring', '', 'YOUR_STANDARD_ID_HERE'),

-- Product Control
('5.1', 'Product design and development', '', 'YOUR_STANDARD_ID_HERE'),
('5.2', 'Product labelling and pack control', '', 'YOUR_STANDARD_ID_HERE'),
('5.3', 'Management of allergens', '', 'YOUR_STANDARD_ID_HERE'),
('5.4', 'Product authenticity, claims and chain of custody', '', 'YOUR_STANDARD_ID_HERE'),
('5.5', 'Product inspection, testing and release', '', 'YOUR_STANDARD_ID_HERE'),
('5.6', 'Control of measuring and monitoring devices', '', 'YOUR_STANDARD_ID_HERE'),

-- Process Control
('6.1', 'Control of operations', '', 'YOUR_STANDARD_ID_HERE'),
('6.2', 'Equipment calibration and maintenance', '', 'YOUR_STANDARD_ID_HERE'),
('6.3', 'Quantity, weight and volume control', '', 'YOUR_STANDARD_ID_HERE'),
('6.4', 'Packaging control', '', 'YOUR_STANDARD_ID_HERE'),
('6.5', 'Start-up, changeover and shut-down procedures', '', 'YOUR_STANDARD_ID_HERE'),

-- Personnel
('7.1', 'Training and competence', '', 'YOUR_STANDARD_ID_HERE'),
('7.2', 'Personal hygiene', '', 'YOUR_STANDARD_ID_HERE'),
('7.3', 'Protective clothing', '', 'YOUR_STANDARD_ID_HERE'),
('7.4', 'Medical screening and fitness to work', '', 'YOUR_STANDARD_ID_HERE'),
('7.5', 'Staff facilities and welfare', '', 'YOUR_STANDARD_ID_HERE'),
('7.6', 'Visitors and contractors', '', 'YOUR_STANDARD_ID_HERE'),

-- Production Risk Zones
('8.1', 'Zoning and segregation', '', 'YOUR_STANDARD_ID_HERE'),
('8.2', 'Premises, equipment and people flow', '', 'YOUR_STANDARD_ID_HERE'),
('8.3', 'Environmental monitoring and cleaning validation', '', 'YOUR_STANDARD_ID_HERE'),
('8.4', 'Temperature, humidity and air-handling controls', '', 'YOUR_STANDARD_ID_HERE'),

-- Requirements for Traded Products
('9.1', 'Approval and performance monitoring of manufacturers/packers', '', 'YOUR_STANDARD_ID_HERE'),
('9.2', 'Product specifications and traceability', '', 'YOUR_STANDARD_ID_HERE'),
('9.3', 'Product inspection and release', '', 'YOUR_STANDARD_ID_HERE'),
('9.4', 'Product authenticity, claims and chain of custody', '', 'YOUR_STANDARD_ID_HERE')

ON CONFLICT (code, standard_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;
