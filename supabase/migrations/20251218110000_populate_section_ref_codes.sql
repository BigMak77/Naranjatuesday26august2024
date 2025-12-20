-- Populate ref_code for standard_sections
-- This migration adds 2-character reference codes to sections based on their code field

-- If code is numeric (like "1", "2", "3"), pad to 2 digits
-- If code is already formatted (like "1.1", "A", etc.), use first 2 chars
UPDATE standard_sections
SET ref_code = CASE
  -- If code is purely numeric, pad with leading zero
  WHEN code ~ '^[0-9]+$' THEN LPAD(code, 2, '0')
  -- If code has decimal (like "1.1"), take first part and pad
  WHEN code ~ '^[0-9]+\.' THEN LPAD(SPLIT_PART(code, '.', 1), 2, '0')
  -- Otherwise use first 2 characters uppercase
  ELSE UPPER(SUBSTRING(code, 1, 2))
END
WHERE ref_code IS NULL OR ref_code = '';

-- Show results
SELECT code, ref_code, title FROM standard_sections ORDER BY code;
