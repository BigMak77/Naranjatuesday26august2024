# SQL Files Cleanup Analysis

## Files to KEEP (Important/Production)
- `supabase/migrations/20251013131723_create_permissions_table.sql` - Production migration
- `supabase/migrations/20251015_add_permissions_to_users.sql` - Production migration
- `db/training_questions.sql` - Core schema
- `db/create-user-training-completions-table-safe.sql` - Safe version
- `db/auto-role-sync-triggers.sql` - Production triggers

## Files SAFE TO DELETE (Debug/Test/Empty)

### Empty Files:
- `emergency-recovery.sql`
- `check-existing-first-aid-columns.sql`

### Debug/Testing Files:
- `debug-user-assignments.sql`
- `simple-check.sql`
- `get-test-user-auth-id.sql`
- `dump-assignments.sql`
- `comprehensive-users-table-analysis.sql`
- `check_user_assignments_structure.sql`
- `check_user_assignments_permissions.sql`
- `get_users_columns.sql`
- `get-all-users-columns.sql`
- `get-users-full-structure.sql`

### Diagnostic Files:
- `diagnose-documents-table.sql`
- `diagnostic-and-force-link.sql`
- `check-table-structure.sql`
- `check-role-assignments-structure.sql`
- `check-role-assignments.sql`
- `check-users-table-for-roles.sql`
- `check-newemployeewizard-tables.sql`
- `check-incidents-table-structure.sql`
- `check-access-column.sql`
- `verify-incidents-table-columns.sql`

### Quick Fix/Test Files:
- `quick-role-check.sql`
- `quick-structure-fix.sql`
- `simple-add-column-test.sql`
- `simple-access-levels.sql`
- `simple-document-fix.sql`
- `simple-documents-recovery.sql`
- `simple-locations-table.sql`

### Manual/Emergency Files (likely outdated):
- `manual-dump-user-assignments.sql`
- `emergency-role-fix.sql`
- `emergency-role-sync-trigger.sql`

### Bulk Operations (if completed):
- `bulk-insert-batch1.sql`
- `BULK_FIX_LEGACY_ASSIGNMENTS.sql`

## Files to REVIEW (might be needed)
- `add-*` files - Check if these features are implemented
- `create-*` files - Check if tables exist
- `fix-*` files - Check if fixes were applied
- `migrate-*` files - Check if migrations were run

Total files that can likely be deleted: ~40-50 files
