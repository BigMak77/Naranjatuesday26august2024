-- Migration: Consolidate role_assignments to use single item_id column
-- This will make role_assignments match user_assignments structure

BEGIN;

-- 1. Add the new item_id column
ALTER TABLE role_assignments ADD COLUMN item_id UUID;

-- 2. Populate item_id with data from module_id or document_id
UPDATE role_assignments 
SET item_id = COALESCE(module_id, document_id);

-- 3. Verify all rows have item_id populated
SELECT COUNT(*) as total_rows FROM role_assignments;
SELECT COUNT(*) as rows_with_item_id FROM role_assignments WHERE item_id IS NOT NULL;
-- These should match!

-- 4. Make item_id NOT NULL since it should always have a value
ALTER TABLE role_assignments ALTER COLUMN item_id SET NOT NULL;

-- 5. Drop the old columns (uncomment after verifying migration works)
-- ALTER TABLE role_assignments DROP COLUMN module_id;
-- ALTER TABLE role_assignments DROP COLUMN document_id;

-- 6. Verify the final structure
SELECT 
    role_id,
    item_id,
    type,
    created_at
FROM role_assignments
WHERE role_id IN ('534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692')
ORDER BY role_id, type;

COMMIT;
