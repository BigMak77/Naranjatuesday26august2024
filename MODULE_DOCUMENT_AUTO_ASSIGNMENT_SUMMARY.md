# Module Document Auto-Assignment - Implementation Summary

## What Was Implemented

A complete bidirectional auto-assignment system that:
1. ✅ Automatically assigns linked documents when a user is assigned to a module
2. ✅ Automatically removes linked documents when a user is unassigned from a module
3. ✅ Safely handles documents shared across multiple modules
4. ✅ Preserves manually assigned documents
5. ✅ Provides manual sync and cleanup functions
6. ✅ Includes API endpoints for frontend integration

## Files Created

### Database Migrations (9 files)

**IMPORTANT:** Migrations are numbered in the order they must be applied.

1. **`supabase/migrations/20251225000000_auto_assign_module_documents.sql`**
   - Creates `auto_assign_module_documents()` trigger function
   - Automatically assigns documents when module is assigned to user
   - Inherits all properties from module assignment (due dates, reasons, etc.)

2. **`supabase/migrations/20251225000001_add_auto_assigned_tracking.sql`**
   - Adds `auto_assigned_from_module` column to `user_assignments` table
   - Tracks which module created each auto-assigned document
   - Includes backfill logic to mark existing auto-assigned documents
   - Creates index for performance
   - **Must run before migration 004 (backfill)**

3. **`supabase/migrations/20251225000002_add_manual_sync_function.sql`**
   - Creates `sync_module_document_assignments(p_auth_id, p_module_id)` function
   - Allows manual synchronization of document assignments
   - Can target specific users or modules, or sync all
   - Initial version does NOT set tracking column (updated in migration 008)

4. **`supabase/migrations/20251225000003_auto_remove_module_documents.sql`**
   - Creates initial `auto_remove_module_documents()` trigger function
   - Automatically removes documents when module is unassigned
   - Initial version using timestamp-based detection

5. **`supabase/migrations/20251225000004_backfill_module_document_assignments.sql`**
   - Backfills document assignments for existing module assignments
   - Safe to run multiple times (uses ON CONFLICT DO NOTHING)
   - Sets `auto_assigned_from_module` for backfilled assignments
   - **Requires migration 001 (tracking column) to run first**

6. **`supabase/migrations/20251225000005_update_auto_assign_with_tracking.sql`**
   - Updates `auto_assign_module_documents()` to set tracking column
   - Ensures all new auto-assigned documents are properly tracked

7. **`supabase/migrations/20251225000006_update_auto_remove_with_tracking.sql`**
   - Updates `auto_remove_module_documents()` to use tracking column
   - Safer removal logic:
     - Only removes documents auto-assigned from the specific module being removed
     - Never removes manually assigned documents
     - Preserves documents linked to other modules user is still assigned to

8. **`supabase/migrations/20251225000007_add_cleanup_function.sql`**
   - Creates `cleanup_orphaned_document_assignments(p_auth_id)` function
   - Removes orphaned document assignments
   - Useful after bulk deletions or manual database changes

9. **`supabase/migrations/20251225000008_update_sync_function_with_tracking.sql`**
   - Updates `sync_module_document_assignments()` to set tracking column
   - Ensures all manually synced documents are properly tracked
   - Replaces the function created in migration 002

### API Endpoint (1 file)

10. **`src/app/api/sync-module-documents/route.ts`**
   - POST endpoint to manually sync and cleanup assignments
   - GET endpoint for preview mode (dry-run)
   - Parameters:
     - `auth_id` - Optional user to sync
     - `module_id` - Optional module to sync
     - `cleanup` - Optional flag to remove orphaned assignments
   - Returns created and removed assignments

### Documentation (2 files)

10. **`MODULE_DOCUMENT_AUTO_ASSIGNMENT.md`**
    - Complete feature documentation
    - Includes:
      - How it works (triggers, functions, API)
      - Database schema details
      - Use cases and examples
      - Migration order
      - Testing instructions
      - Troubleshooting guide

11. **`MODULE_DOCUMENT_AUTO_ASSIGNMENT_SUMMARY.md`** (this file)
    - Quick reference for implementation
    - File list and descriptions

## Database Changes

### New Column Added

**Table:** `user_assignments`

**Column:** `auto_assigned_from_module` (UUID, nullable)
- References `modules(id)` with ON DELETE SET NULL
- Tracks which module auto-created this document assignment
- NULL for:
  - Manually assigned documents
  - Module assignments (not documents)
  - Documents assigned before this feature

**Index:** `idx_user_assignments_auto_assigned`
- Partial index on `auto_assigned_from_module` WHERE NOT NULL
- Improves performance of removal and cleanup operations

### New Triggers

1. **`trigger_auto_assign_module_documents`**
   - Event: AFTER INSERT on `user_assignments`
   - When: `item_type = 'module'`
   - Action: Creates document assignments for linked documents

2. **`trigger_auto_remove_module_documents`**
   - Event: BEFORE DELETE on `user_assignments`
   - When: `item_type = 'module'`
   - Action: Removes auto-assigned documents (with safety checks)

### New Functions

1. **`auto_assign_module_documents()`**
   - Trigger function for auto-assignment
   - Returns: TRIGGER

2. **`auto_remove_module_documents()`**
   - Trigger function for auto-removal
   - Returns: TRIGGER

3. **`sync_module_document_assignments(p_auth_id UUID, p_module_id UUID)`**
   - Manual sync function
   - Returns: TABLE (user_id, document_id, action)

4. **`cleanup_orphaned_document_assignments(p_auth_id UUID)`**
   - Cleanup orphaned assignments
   - Returns: TABLE (user_id, document_id, orphaned_from_module, action)

## How It Works

### When Module Is Assigned

```
User assigned to module
         ↓
Trigger: auto_assign_module_documents()
         ↓
Query: document_modules for linked documents
         ↓
For each linked document:
  - Check if already assigned (skip if yes)
  - Create assignment with:
    * Same due_at as module
    * Same assignment_reason
    * Same refresh settings
    * Set auto_assigned_from_module = module.id
```

### When Module Is Removed

```
User unassigned from module
         ↓
Trigger: auto_remove_module_documents()
         ↓
Find documents with auto_assigned_from_module = this module
         ↓
For each document:
  - Skip if manually assigned (auto_assigned_from_module IS NULL)
  - Skip if linked to other modules user still has
  - Otherwise: DELETE assignment
```

### Safety Features

1. **Prevents Duplicate Assignments**
   - Uses UNIQUE constraint on (auth_id, item_id, item_type)
   - Uses ON CONFLICT DO NOTHING in all insert operations

2. **Preserves Shared Documents**
   - Checks if document is linked to other modules user has
   - Only removes if no other module references it

3. **Preserves Manual Assignments**
   - Only touches documents where auto_assigned_from_module IS NOT NULL
   - Manual assignments have auto_assigned_from_module = NULL

4. **Idempotent Operations**
   - All functions safe to run multiple times
   - Sync function skips existing assignments
   - Cleanup function only removes truly orphaned assignments

## Usage Examples

### Via SQL

```sql
-- Create module assignment (auto-creates document assignments)
INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at, due_at)
VALUES ('user-id', 'module-id', 'module', NOW(), NOW() + INTERVAL '7 days');

-- Remove module assignment (auto-removes document assignments)
DELETE FROM user_assignments
WHERE auth_id = 'user-id' AND item_id = 'module-id' AND item_type = 'module';

-- Manual sync for specific user
SELECT * FROM sync_module_document_assignments('user-id', NULL);

-- Cleanup orphaned assignments
SELECT * FROM cleanup_orphaned_document_assignments(NULL);
```

### Via API

```bash
# Sync all module-document assignments
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync and cleanup for specific user
curl -X POST http://localhost:3000/api/sync-module-documents \
  -H "Content-Type: application/json" \
  -d '{"auth_id": "user-uuid", "cleanup": true}'

# Preview what would be synced (GET)
curl http://localhost:3000/api/sync-module-documents?auth_id=user-uuid
```

## Migration Instructions

1. **Apply migrations in order** (they are numbered 000-007)
   ```bash
   npx supabase db push
   ```

2. **Verify triggers are active**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%module_documents%';
   ```

3. **Check backfill results**
   - Look for NOTICE messages in PostgreSQL logs
   - Query: `SELECT COUNT(*) FROM user_assignments WHERE auto_assigned_from_module IS NOT NULL;`

4. **Test with sample data**
   - Create a test module assignment
   - Verify document assignments are created
   - Delete the module assignment
   - Verify document assignments are removed (if appropriate)

## Rollback Strategy

If you need to rollback this feature:

1. **Drop triggers:**
   ```sql
   DROP TRIGGER IF EXISTS trigger_auto_assign_module_documents ON user_assignments;
   DROP TRIGGER IF EXISTS trigger_auto_remove_module_documents ON user_assignments;
   ```

2. **Drop functions:**
   ```sql
   DROP FUNCTION IF EXISTS auto_assign_module_documents();
   DROP FUNCTION IF EXISTS auto_remove_module_documents();
   DROP FUNCTION IF EXISTS sync_module_document_assignments(UUID, UUID);
   DROP FUNCTION IF EXISTS cleanup_orphaned_document_assignments(UUID);
   ```

3. **Remove column (optional):**
   ```sql
   ALTER TABLE user_assignments DROP COLUMN IF EXISTS auto_assigned_from_module;
   ```

4. **Delete API endpoint:**
   ```bash
   rm src/app/api/sync-module-documents/route.ts
   ```

## Performance Considerations

- **Trigger Overhead:** Each module assignment triggers one query to `document_modules`
- **Bulk Operations:** For bulk assignments (100+ users), consider using manual sync API
- **Index Usage:** Removal operations use the `idx_user_assignments_auto_assigned` index
- **Cascading:** Module deletion will trigger document removal for all affected users

## Next Steps / Future Enhancements

Potential improvements:

1. **Cascade Completion:** Auto-complete module when all linked documents are completed
2. **Cascade Updates:** Update document due dates when module due date changes
3. **Selective Linking:** UI to choose which documents auto-assign vs manual-only
4. **Batch Mode:** Statement-level triggers for better bulk operation performance
5. **Audit Trail:** Track auto-assignment history in separate audit table
6. **Notifications:** Notify users when documents are auto-assigned/removed
7. **Admin UI:** Dashboard showing auto-assignment statistics and status

## Testing Checklist

- [ ] Apply migrations to development database
- [ ] Verify triggers are created and active
- [ ] Create test module with linked documents
- [ ] Assign module to test user
- [ ] Verify document assignments created automatically
- [ ] Check `auto_assigned_from_module` is set correctly
- [ ] Delete module assignment
- [ ] Verify document assignments removed (if not shared)
- [ ] Test with shared documents across multiple modules
- [ ] Test manual sync API endpoint
- [ ] Test cleanup function
- [ ] Test GET endpoint (preview mode)
- [ ] Verify manually assigned documents are never auto-removed
- [ ] Check performance with bulk operations (optional)

## Support

For questions or issues:
- Review full documentation in `MODULE_DOCUMENT_AUTO_ASSIGNMENT.md`
- Check troubleshooting section in documentation
- Review migration files for detailed SQL logic
- Test in development environment before production deployment
