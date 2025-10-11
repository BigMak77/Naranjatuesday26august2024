-- AUTOMATIC ROLE SYNC TRIGGER
-- This will prevent future role change issues by automatically syncing assignments

-- Create the sync function
CREATE OR REPLACE FUNCTION sync_user_assignments_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if role_id actually changed
    IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
        -- Log the role change
        INSERT INTO audit_log (
            table_name, 
            operation, 
            user_id, 
            old_values, 
            new_values, 
            timestamp
        ) VALUES (
            'users',
            'role_change_auto_sync', 
            NEW.id,
            jsonb_build_object('old_role_id', OLD.role_id),
            jsonb_build_object('new_role_id', NEW.role_id),
            NOW()
        );

        -- Remove ALL existing assignments for this user
        DELETE FROM user_assignments 
        WHERE auth_id = NEW.auth_id;

        -- Insert new assignments based on the new role
        INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
        SELECT 
            NEW.auth_id,
            COALESCE(ra.document_id, ra.module_id) as item_id,
            ra.type as item_type,
            NOW()
        FROM role_assignments ra
        WHERE ra.role_id = NEW.role_id;

        -- Log completion
        INSERT INTO audit_log (
            table_name, 
            operation, 
            user_id, 
            new_values, 
            timestamp
        ) VALUES (
            'user_assignments',
            'auto_sync_completed', 
            NEW.id,
            jsonb_build_object(
                'new_role_id', NEW.role_id,
                'assignments_synced', (SELECT COUNT(*) FROM role_assignments WHERE role_id = NEW.role_id)
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_assignments_on_role_change ON users;

-- Create the trigger
CREATE TRIGGER trigger_sync_assignments_on_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_assignments_on_role_change();

-- Verify trigger was created
SELECT 
    'Trigger Created Successfully!' as result,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_assignments_on_role_change';
