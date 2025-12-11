# Migration Instructions - Follow-Up System Refactor

## Error Fix Required

You're getting a **400 error** because the `training_logs` table is missing the `outcome` column that the updated code is trying to use.

## Migrations to Apply

You need to apply **TWO** migration files:

### 1. Add outcome column to training_logs
**File:** `supabase/migrations/20251210_add_outcome_to_training_logs.sql`

This adds the `outcome` column to track training results (completed, needs_improvement, failed).

### 2. Refactor follow-up system
**File:** `supabase/migrations/20251210_refactor_follow_up_system.sql`

This updates the modules and user_assignments tables with new fields for the three-tier follow-up system.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of each migration file
4. Paste and run them in order:
   - First: `20251210_add_outcome_to_training_logs.sql`
   - Second: `20251210_refactor_follow_up_system.sql`

### Option 2: Supabase CLI (If you have it set up)

```bash
cd /Users/bigmak/Documents/Naranja\ 4.3\ copy
npx supabase db push
```

### Option 3: Local Development

If running locally:
```bash
npx supabase start
npx supabase migration up
```

## Migration Order

**IMPORTANT:** Apply migrations in this exact order:

1. ✅ `20251210_add_outcome_to_training_logs.sql` - Adds outcome column
2. ✅ `20251210_refactor_follow_up_system.sql` - Refactors follow-up system

## What These Migrations Do

### Migration 1: training_logs.outcome
- Adds `outcome` column with valid values: 'completed', 'needs_improvement', 'failed'
- Sets default to 'completed' for existing records
- Adds check constraint for data integrity

### Migration 2: Follow-up System
- Renames `modules.review_period` → `modules.follow_up_period`
- Adds `modules.refresh_period` for scheduled refresher training
- Renames `user_assignments.follow_up_*` fields to `follow_up_assessment_*`
- Adds `user_assignments.training_outcome` field
- Adds `user_assignments.refresh_due_date` field
- Creates helper functions for date calculations
- Creates views for easy querying

## After Migration

Once migrations are applied:

1. **Test Training Log:**
   - Go to Trainer View
   - Try logging training with each outcome:
     - ✅ Completed - Satisfactory
     - ⚠️ Needs Improvement
     - ❌ Failed
   - Verify signatures only appear for "Completed"

2. **Test Module Configuration:**
   - Create/edit a module
   - Set follow-up assessment period
   - Set refresh training period

3. **Check Database:**
   ```sql
   -- Verify training_logs has outcome column
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'training_logs';

   -- Verify modules has new columns
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'modules'
   AND column_name IN ('follow_up_period', 'refresh_period');
   ```

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Rollback training_logs changes
ALTER TABLE training_logs DROP COLUMN IF EXISTS outcome;

-- Rollback follow-up system changes
-- (See migration file for specific columns to drop)
```

## Troubleshooting

### Error: "column already exists"
- Migration may have been partially applied
- Check which columns exist and skip those parts

### Error: "constraint already exists"
- Drop the existing constraint first:
  ```sql
  ALTER TABLE training_logs DROP CONSTRAINT IF EXISTS chk_training_logs_outcome;
  ```

### Error: "relation does not exist"
- Table name might be different
- Check actual table names in your database

## Verification Queries

After migration, run these to verify:

```sql
-- Check training_logs structure
SELECT * FROM training_logs LIMIT 1;

-- Check modules structure
SELECT id, name, requires_follow_up, follow_up_period, refresh_period
FROM modules LIMIT 5;

-- Check user_assignments structure
SELECT id, training_outcome, follow_up_assessment_required, refresh_due_date
FROM user_assignments LIMIT 5;

-- Check new views
SELECT * FROM training_follow_ups LIMIT 5;
SELECT * FROM training_refresh_due LIMIT 5;
```

## Need Help?

If you encounter issues:
1. Check the error message carefully
2. Verify you're connected to the correct database
3. Check that you have the necessary permissions
4. Review the migration SQL files for any conflicts with existing schema

## Summary

✅ **Two migrations** need to be applied
✅ **Apply in order** (outcome column first, then follow-up system)
✅ **Test thoroughly** after applying
✅ **Verify** using the provided SQL queries

Once migrations are applied, the training system will work with the new three-tier outcome system!
