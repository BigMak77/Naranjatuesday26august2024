-- Emergency Database Trigger for Automatic Role Assignment Sync
-- This trigger will automatically clean up and reassign training when a user's role changes

-- First, create a function to sync user assignments when role changes
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
            'role_change', 
            NEW.id,
            jsonb_build_object('role_id', OLD.role_id),
            jsonb_build_object('role_id', NEW.role_id),
            NOW()
        );

        -- Step 1: Remove ALL existing assignments for this user
        DELETE FROM user_assignments 
        WHERE auth_id = NEW.auth_id;

        -- Step 2: Insert new assignments based on the new role
        INSERT INTO user_assignments (auth_id, module_id, document_id, type, assigned_at)
        SELECT 
            NEW.auth_id,
            ra.module_id,
            ra.document_id,
            ra.type,
            NOW()
        FROM role_assignments ra
        WHERE ra.role_id = NEW.role_id;

        -- Log the sync completion
        INSERT INTO audit_log (
            table_name, 
            operation, 
            user_id, 
            new_values, 
            timestamp
        ) VALUES (
            'user_assignments',
            'role_sync_complete', 
            NEW.id,
            jsonb_build_object(
                'assignments_added', (SELECT COUNT(*) FROM role_assignments WHERE role_id = NEW.role_id)
            ),
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_assignments_on_role_change ON users;
CREATE TRIGGER trigger_sync_assignments_on_role_change
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_assignments_on_role_change();

-- Emergency fix function for specific users
CREATE OR REPLACE FUNCTION emergency_fix_user_assignments(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    user_record RECORD;
    assignments_before INTEGER;
    assignments_after INTEGER;
    result JSON;
BEGIN
    -- Get user info
    SELECT * INTO user_record FROM users WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    -- Count current assignments
    SELECT COUNT(*) INTO assignments_before 
    FROM user_assignments 
    WHERE auth_id = user_record.auth_id;

    -- Remove all current assignments
    DELETE FROM user_assignments 
    WHERE auth_id = user_record.auth_id;

    -- Add new assignments based on current role
    INSERT INTO user_assignments (auth_id, module_id, document_id, type, assigned_at)
    SELECT 
        user_record.auth_id,
        ra.module_id,
        ra.document_id,
        ra.type,
        NOW()
    FROM role_assignments ra
    WHERE ra.role_id = user_record.role_id;

    -- Count new assignments
    SELECT COUNT(*) INTO assignments_after 
    FROM user_assignments 
    WHERE auth_id = user_record.auth_id;

    -- Build result
    result := json_build_object(
        'user_id', user_uuid,
        'role_id', user_record.role_id,
        'assignments_before', assignments_before,
        'assignments_after', assignments_after,
        'fixed_at', NOW()
    );

    -- Log the fix
    INSERT INTO audit_log (
        table_name, 
        operation, 
        user_id, 
        old_values,
        new_values, 
        timestamp
    ) VALUES (
        'user_assignments',
        'emergency_fix', 
        user_uuid,
        json_build_object('assignments_count', assignments_before),
        json_build_object('assignments_count', assignments_after),
        NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix a specific user (replace with actual user ID)
-- SELECT emergency_fix_user_assignments('YOUR_USER_ID_HERE'::UUID);
