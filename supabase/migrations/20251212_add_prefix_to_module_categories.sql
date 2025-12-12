-- Add prefix column to module_categories table
ALTER TABLE module_categories
ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Add a comment to explain the prefix column
COMMENT ON COLUMN module_categories.prefix IS 'Optional prefix for module reference codes in this category (e.g., HS for Health & Safety)';
