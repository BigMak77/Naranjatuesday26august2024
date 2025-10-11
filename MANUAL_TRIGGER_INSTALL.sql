/* 
 * AUTOMATIC ROLE SYNC TRIGGER INSTALLATION
 * 
 * After fixing the user manually, install this trigger to prevent future issues
 * Copy and paste these SQL statements into your database client
 */

-- 1. Create the automatic sync function
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
        INSERT INTO user_assignments (auth_id, module_id, document_id, type, assigned_at)
        SELECT 
            NEW.auth_id,
            ra.module_id,
            ra.document_id,
            ra.type,
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

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_assignments_on_role_change ON users;

-- 3. Create the trigger
CREATE TRIGGER trigger_sync_assignments_on_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_assignments_on_role_change();

-- 4. Verify trigger was created
SELECT 
    'Trigger Installation Complete!' as result,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_assignments_on_role_change';

-- 5. Success message
SELECT '🔄 AUTOMATIC ROLE SYNC TRIGGER INSTALLED SUCCESSFULLY!' as result;
