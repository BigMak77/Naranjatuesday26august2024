-- Populate ref_code for existing document types
-- This migration adds 2-character reference codes to document types

-- Update common document type ref codes
UPDATE document_types SET ref_code = 'PO' WHERE LOWER(name) LIKE '%policy%' OR LOWER(name) LIKE '%policies%';
UPDATE document_types SET ref_code = 'PR' WHERE LOWER(name) LIKE '%procedure%' OR LOWER(name) LIKE '%procedures%';
UPDATE document_types SET ref_code = 'SO' WHERE LOWER(name) LIKE '%sop%' OR LOWER(name) = 'standard operating procedure';
UPDATE document_types SET ref_code = 'WI' WHERE LOWER(name) LIKE '%work instruction%' OR LOWER(name) LIKE '%wi%';
UPDATE document_types SET ref_code = 'FM' WHERE LOWER(name) LIKE '%form%' OR LOWER(name) LIKE '%forms%';
UPDATE document_types SET ref_code = 'GD' WHERE LOWER(name) LIKE '%guide%' OR LOWER(name) LIKE '%guidance%';
UPDATE document_types SET ref_code = 'CL' WHERE LOWER(name) LIKE '%checklist%';
UPDATE document_types SET ref_code = 'TP' WHERE LOWER(name) LIKE '%template%';
UPDATE document_types SET ref_code = 'MN' WHERE LOWER(name) LIKE '%manual%';
UPDATE document_types SET ref_code = 'SP' WHERE LOWER(name) LIKE '%specification%';
UPDATE document_types SET ref_code = 'ST' WHERE LOWER(name) LIKE '%standard%' AND LOWER(name) NOT LIKE '%sop%';
UPDATE document_types SET ref_code = 'PL' WHERE LOWER(name) LIKE '%plan%';
UPDATE document_types SET ref_code = 'RP' WHERE LOWER(name) LIKE '%report%';
UPDATE document_types SET ref_code = 'RC' WHERE LOWER(name) LIKE '%record%';
UPDATE document_types SET ref_code = 'AS' WHERE LOWER(name) LIKE '%assessment%';
UPDATE document_types SET ref_code = 'AU' WHERE LOWER(name) LIKE '%audit%';
UPDATE document_types SET ref_code = 'TR' WHERE LOWER(name) LIKE '%training%';
UPDATE document_types SET ref_code = 'CT' WHERE LOWER(name) LIKE '%certificate%';
UPDATE document_types SET ref_code = 'NT' WHERE LOWER(name) LIKE '%notice%' OR LOWER(name) LIKE '%notification%';
UPDATE document_types SET ref_code = 'SSOW' WHERE LOWER(name) LIKE '%ssow%' OR LOWER(name) LIKE '%safe system of work%';

-- For any remaining document types without a ref_code, you can manually set them
-- Or use a default pattern based on the first 2 letters
UPDATE document_types
SET ref_code = UPPER(SUBSTRING(name, 1, 2))
WHERE ref_code IS NULL OR ref_code = '';

-- Show results
SELECT name, ref_code FROM document_types ORDER BY name;
