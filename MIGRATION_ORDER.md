# Migration Order - Module Document Auto-Assignment

## Quick Reference

Apply these migrations in numerical order:

```
20251225000000_auto_assign_module_documents.sql         ✅ Basic trigger
20251225000001_add_auto_assigned_tracking.sql           ✅ Add tracking column
20251225000002_add_manual_sync_function.sql             ✅ Sync function (basic)
20251225000003_auto_remove_module_documents.sql         ✅ Remove trigger (basic)
20251225000004_backfill_module_document_assignments.sql ✅ Backfill data
20251225000005_update_auto_assign_with_tracking.sql     ✅ Upgrade assign trigger
20251225000006_update_auto_remove_with_tracking.sql     ✅ Upgrade remove trigger
20251225000007_add_cleanup_function.sql                 ✅ Cleanup function
20251225000008_update_sync_function_with_tracking.sql   ✅ Upgrade sync function
```

## Migration Flow Diagram

```
Phase 1: Basic Functionality
┌─────────────────────────────────────────┐
│ 000: Create auto-assign trigger         │ ← Creates document assignments
│      (without tracking)                  │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 001: Add auto_assigned_from_module      │ ← Adds tracking column
│      column + backfill existing         │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 002: Create sync function               │ ← Manual sync (basic)
│      (without tracking)                  │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 003: Create auto-remove trigger         │ ← Removes document assignments
│      (timestamp-based detection)         │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 004: Backfill module assignments        │ ← Create missing doc assignments
│      (with tracking)                     │   (uses tracking column)
└─────────────────────────────────────────┘

Phase 2: Upgrade to Tracking-Based
┌─────────────────────────────────────────┐
│ 005: Update auto-assign trigger         │ ← Now sets tracking column
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 006: Update auto-remove trigger         │ ← Now uses tracking column
│      (safe removal logic)                │   (instead of timestamps)
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 007: Create cleanup function            │ ← Removes orphaned assignments
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 008: Update sync function               │ ← Now sets tracking column
└─────────────────────────────────────────┘

DONE! ✅ All triggers and functions now use tracking column
```

## Why This Order?

### Column Must Exist Before Use
- Migration **001** creates `auto_assigned_from_module` column
- Migration **004** uses this column in INSERT
- Migration **005-008** use this column in triggers/functions
- **Therefore:** 001 must run before 004, 005, 006, 007, 008

### Functions Created Then Updated
- Migration **002** creates sync function WITHOUT tracking
- Migration **008** updates it to use tracking
- This allows the function to exist for use between migrations
- **Alternative approach** would require all migrations in single transaction

### Triggers Created Then Updated
- Migrations **000, 003** create basic triggers
- Migrations **005, 006** replace them with tracking-aware versions
- This ensures triggers are always functional, even mid-migration

## Critical Dependencies

```
001 (add column) ──┬─→ 004 (backfill uses column)
                   ├─→ 005 (assign trigger uses column)
                   ├─→ 006 (remove trigger uses column)
                   ├─→ 007 (cleanup uses column)
                   └─→ 008 (sync function uses column)

002 (create sync function) ──→ 008 (update sync function)
003 (create remove trigger) ──→ 006 (update remove trigger)
000 (create assign trigger) ──→ 005 (update assign trigger)
```

## Running Migrations

### Option 1: Supabase CLI (Recommended)
```bash
npx supabase db push
```
This automatically runs migrations in correct order.

### Option 2: Manual Application
```bash
psql $DATABASE_URL -f supabase/migrations/20251225000000_auto_assign_module_documents.sql
psql $DATABASE_URL -f supabase/migrations/20251225000001_add_auto_assigned_tracking.sql
psql $DATABASE_URL -f supabase/migrations/20251225000002_add_manual_sync_function.sql
psql $DATABASE_URL -f supabase/migrations/20251225000003_auto_remove_module_documents.sql
psql $DATABASE_URL -f supabase/migrations/20251225000004_backfill_module_document_assignments.sql
psql $DATABASE_URL -f supabase/migrations/20251225000005_update_auto_assign_with_tracking.sql
psql $DATABASE_URL -f supabase/migrations/20251225000006_update_auto_remove_with_tracking.sql
psql $DATABASE_URL -f supabase/migrations/20251225000007_add_cleanup_function.sql
psql $DATABASE_URL -f supabase/migrations/20251225000008_update_sync_function_with_tracking.sql
```

## Verification After Migration

### Check Column Exists
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_assignments'
  AND column_name = 'auto_assigned_from_module';
```

### Check Triggers Exist
```sql
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%module_documents%';
```
Should show:
- `trigger_auto_assign_module_documents`
- `trigger_auto_remove_module_documents`

### Check Functions Exist
```sql
SELECT proname, pronargs
FROM pg_proc
WHERE proname IN (
  'auto_assign_module_documents',
  'auto_remove_module_documents',
  'sync_module_document_assignments',
  'cleanup_orphaned_document_assignments'
);
```

### Check Backfill Results
```sql
-- Count auto-assigned documents
SELECT COUNT(*)
FROM user_assignments
WHERE auto_assigned_from_module IS NOT NULL;

-- Show which modules created the most assignments
SELECT auto_assigned_from_module, COUNT(*)
FROM user_assignments
WHERE auto_assigned_from_module IS NOT NULL
GROUP BY auto_assigned_from_module
ORDER BY COUNT(*) DESC
LIMIT 10;
```

## Troubleshooting

### Error: Column "auto_assigned_from_module" does not exist
**Cause:** Trying to run migration 004, 005, 006, 007, or 008 before 001
**Fix:** Run migration 001 first, then retry

### Error: Function already exists
**Cause:** Re-running a migration that creates a function
**Fix:** This is OK - migrations use `CREATE OR REPLACE FUNCTION`

### Error: Trigger already exists
**Cause:** Re-running a migration that creates a trigger
**Fix:** This is OK - migrations use `DROP TRIGGER IF EXISTS` before creating

### Backfill reports 0 assignments created
**Possible causes:**
1. No module assignments exist
2. All document assignments already exist
3. No documents linked to modules

**Check:**
```sql
-- Do module assignments exist?
SELECT COUNT(*) FROM user_assignments WHERE item_type = 'module';

-- Are there module-document links?
SELECT COUNT(*) FROM document_modules;

-- Are document assignments already created?
SELECT COUNT(*) FROM user_assignments WHERE item_type = 'document';
```

## What Each Migration Does

| # | Migration | Creates | Updates | Depends On |
|---|-----------|---------|---------|------------|
| 000 | auto_assign_module_documents | ✅ Trigger function, Trigger | - | - |
| 001 | add_auto_assigned_tracking | ✅ Column, Index | Backfills existing data | - |
| 002 | add_manual_sync_function | ✅ Function | - | - |
| 003 | auto_remove_module_documents | ✅ Trigger function, Trigger | - | - |
| 004 | backfill_module_document_assignments | - | Inserts missing assignments | 001 |
| 005 | update_auto_assign_with_tracking | - | ✅ Function (from 000) | 001 |
| 006 | update_auto_remove_with_tracking | - | ✅ Function (from 003) | 001 |
| 007 | add_cleanup_function | ✅ Function | - | 001 |
| 008 | update_sync_function_with_tracking | - | ✅ Function (from 002) | 001 |
