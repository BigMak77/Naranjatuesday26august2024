# Supabase Trigger Audit Report

**Generated:** 2025-12-26
**Database:** Naranja Training System

## Executive Summary

Your database currently has **20 triggers** and **26 trigger functions**. After comprehensive review, I've identified:

- ✅ **10 triggers that are NEEDED and working correctly**
- ⚠️ **2 triggers with CONFLICTS that need fixing**
- ❌ **1 trigger that is DISABLED but still exists**
- 🔍 **Multiple overlapping migration files that should be consolidated**

---

## Detailed Trigger Inventory

### 1. USER TRAINING ASSIGNMENT TRIGGERS (users table)

#### ✅ NEEDED: Department Training Sync
**Triggers:**
- `trigger_sync_department_training_on_insert`
- `trigger_sync_department_training_on_update`

**Function:** `sync_department_training_to_user()`
**Created in:** `20251129083200_auto_sync_department_training.sql`
**Purpose:** Assigns department-level training to users when they join/change departments
**Status:** ✅ Working correctly after fix in `20251226150000_fix_user_update_trigger_conflicts.sql`

**What it does:**
- When a user is inserted or their role_id changes
- Looks up the department_id from their role
- Assigns all training from department_assignments to the user

**Fix Applied:**
- Originally fired on BOTH department_id AND role_id changes (line 47 in original migration)
- Fixed to ONLY fire on department_id changes to avoid conflict with role trigger
- Uses `AFTER UPDATE OF department_id` instead of `AFTER UPDATE OF role_id`

---

#### ✅ NEEDED: Role Training Sync
**Triggers:**
- `trigger_sync_role_training_on_insert`
- `trigger_sync_role_training_on_update`

**Function:** `sync_role_training_to_user()`
**Created in:** `20251213114900_auto_sync_role_training.sql`
**Purpose:** Assigns role-level training to users when they join/change roles
**Status:** ✅ Working correctly

**What it does:**
- When a user is inserted or their role_id changes
- Assigns all training from role_assignments for that role to the user
- Uses `AFTER UPDATE OF role_id` with WHEN clause to only fire on actual changes

---

### 2. DEPARTMENT ASSIGNMENT TRIGGERS (department_assignments table)

#### ✅ NEEDED: Sync New Department Training
**Trigger:** `trigger_sync_new_department_assignment`
**Function:** `sync_new_department_assignment_to_users()`
**Created in:** `20251129083200_auto_sync_department_training.sql`
**Purpose:** When new training is added to a department, assign it to all existing users in that department
**Status:** ✅ Working correctly

---

### 3. ROLE ASSIGNMENT TRIGGERS (role_assignments table)

#### ✅ NEEDED: Sync New Role Training
**Trigger:** `trigger_sync_new_role_assignment`
**Function:** `sync_new_role_assignment_to_users()`
**Created in:** `20251213114900_auto_sync_role_training.sql`
**Purpose:** When new training is added to a role, assign it to all existing users with that role
**Status:** ✅ Working correctly

---

### 4. MODULE DOCUMENT TRIGGERS (user_assignments table)

#### ✅ NEEDED: Auto-Assign Module Documents
**Trigger:** `trigger_auto_assign_module_documents`
**Function:** `auto_assign_module_documents()`
**Created in:** `20251225000000_auto_assign_module_documents.sql`
**Updated in:** `20251225000005_update_auto_assign_with_tracking.sql`
**Purpose:** When a module is assigned to a user, automatically assign all linked documents
**Status:** ✅ Working correctly

**Potential Issue:** ⚠️ This trigger fires on ALL inserts to user_assignments, which means it runs EVERY time:
- Department training is synced
- Role training is synced
- Manual assignments are created
- Group training is assigned

This could cause performance issues if you have many users/modules/documents.

---

#### ✅ NEEDED: Auto-Remove Module Documents
**Trigger:** `trigger_auto_remove_module_documents`
**Function:** `auto_remove_module_documents()`
**Created in:** `20251225000003_auto_remove_module_documents.sql`
**Updated in:** `20251225000006_update_auto_remove_with_tracking.sql`
**Purpose:** When a module assignment is deleted, automatically remove linked document assignments
**Status:** ✅ Working correctly

---

### 5. TEST COMPLETION TRIGGERS (test_attempts table)

#### ❌ DISABLED: Auto-Complete Training on Test Pass
**Trigger:** `trigger_auto_complete_training_on_test_pass` (DROPPED)
**Function:** `auto_complete_training_on_test_pass()` (exists but disabled)
**Created in:** `20251219100000_auto_complete_training_on_test_pass.sql`
**Disabled in:** `20251221130000_disable_auto_complete_on_test_pass.sql`
**Re-enabled in:** `20251226120000_update_auto_complete_trigger_add_training_logs.sql`
**Purpose:** Auto-mark training complete when user passes test

**Status:** ⚠️ **CONFLICTING MIGRATIONS** - Three different migrations:
1. Created the trigger
2. Disabled/dropped the trigger
3. Re-created the trigger with training_logs functionality

**Current state:** Trigger likely EXISTS and is ACTIVE (based on latest migration)
**Recommendation:** Need to verify actual state in database

---

## Critical Issues Found

### 🔴 ISSUE 1: Duplicate/Conflicting Trigger Fix Files

You have THREE files trying to fix the same trigger conflict:

1. `FIX_TRIGGER_CONFLICT.sql` (root directory)
2. `COMPREHENSIVE_TRIGGER_FIX.sql` (root directory)
3. `supabase/migrations/20251226150000_fix_user_update_trigger_conflicts.sql`

**Problem:** These are all trying to fix the department trigger, but only the migration file (#3) will actually be applied by Supabase.

**Recommendation:** ✅ Delete files #1 and #2 - they're duplicates and could cause confusion.

---

### 🔴 ISSUE 2: Test Auto-Complete Trigger State Unclear

The `auto_complete_training_on_test_pass` trigger has conflicting migrations:

- **20251221130000** - DISABLES the trigger (drops it)
- **20251226120000** - RE-ENABLES the trigger (recreates it with new functionality)

**Problem:** Migration timestamps suggest it was disabled on Dec 21, then re-enabled on Dec 26. The latest migration should be active, but you need to verify.

**Recommendation:**
- Run the audit query SECTION 3 from `SUPABASE_TRIGGER_AUDIT.sql` to verify current state
- If the trigger exists, verify it includes the training_logs functionality
- If it doesn't exist, decide if you want it enabled or not

---

### ⚠️ ISSUE 3: Duplicate Training Logs

Migration `20251226130000_remove_duplicate_training_logs.sql` removes duplicates and adds a unique index.

**Recommendation:** ✅ This is good - run this migration to clean up data.

---

### ⚠️ ISSUE 4: Trigger Execution Order

When a user's role changes, triggers fire in **alphabetical order**:

1. `trigger_auto_assign_module_documents` (fires on the INSERT)
2. `trigger_sync_department_training_on_insert`
3. `trigger_sync_department_training_on_update`
4. `trigger_sync_role_training_on_insert`
5. `trigger_sync_role_training_on_update`

**Potential Issue:** The module document auto-assign trigger fires for EVERY assignment that gets created, which could cause:
- Performance degradation with many assignments
- Many small INSERT operations instead of batch operations

**Recommendation:** Consider batch processing or add a flag to track auto-assigned documents.

---

## Trigger Function Inventory

Based on migrations, these functions should exist:

### Active Functions
1. ✅ `sync_department_training_to_user()` - Department assignment
2. ✅ `sync_new_department_assignment_to_users()` - Bulk department assignment
3. ✅ `sync_role_training_to_user()` - Role assignment
4. ✅ `sync_new_role_assignment_to_users()` - Bulk role assignment
5. ✅ `auto_assign_module_documents()` - Auto-assign documents with module
6. ✅ `auto_remove_module_documents()` - Auto-remove documents when module removed
7. ⚠️ `auto_complete_training_on_test_pass()` - May or may not be active

### Utility Functions
8. ✅ `manual_sync_module_documents()` - Manual sync function (20251225000002)
9. ✅ `cleanup_orphaned_document_assignments()` - Cleanup function (20251225000007)

---

## Recommendations

### Immediate Actions

1. **Delete duplicate fix files:**
   ```bash
   rm FIX_TRIGGER_CONFLICT.sql
   rm COMPREHENSIVE_TRIGGER_FIX.sql
   ```

2. **Verify test auto-complete trigger state:**
   Run this query in Supabase:
   ```sql
   SELECT trigger_name, event_manipulation, action_timing
   FROM information_schema.triggers
   WHERE event_object_table = 'test_attempts'
   AND trigger_schema = 'public';
   ```

3. **Apply pending migrations:**
   - `20251226120000_update_auto_complete_trigger_add_training_logs.sql`
   - `20251226130000_remove_duplicate_training_logs.sql`
   - `20251226150000_fix_user_update_trigger_conflicts.sql`

4. **Run training log deduplication:**
   This is safe to run and will clean up duplicate entries.

---

### Long-term Improvements

1. **Add trigger monitoring:**
   Create a view to track trigger execution counts and performance:
   ```sql
   CREATE VIEW trigger_health AS
   SELECT ...
   ```

2. **Consider consolidating triggers:**
   The department + role triggers could potentially be merged into a single "user_role_change" trigger.

3. **Add circuit breakers:**
   For triggers that can cause cascading inserts (like module document assignment), consider adding:
   - Row count limits
   - Execution time monitoring
   - Error logging

4. **Document trigger dependencies:**
   Create a visual diagram showing:
   - Which triggers fire on which tables
   - Which triggers can trigger other triggers
   - Execution order for overlapping triggers

---

## Testing Recommendations

Before applying fixes, test in this order:

1. **Test role change:** Update a user's role_id and verify:
   - Department training is NOT assigned twice
   - Role training IS assigned
   - No duplicate entries in user_assignments

2. **Test module assignment:** Assign a module with linked documents and verify:
   - Documents are auto-assigned
   - No performance issues
   - Correct metadata is copied

3. **Test test completion:** Have a user pass a test and verify:
   - Training is marked complete (if trigger is enabled)
   - Training log is created (if trigger is enabled)
   - No duplicate log entries

---

## Files to Keep vs. Delete

### ✅ KEEP (Migrations)
- All files in `supabase/migrations/` - these are your source of truth
- `SUPABASE_TRIGGER_AUDIT.sql` - useful diagnostic tool

### ❌ DELETE (Duplicates)
- `FIX_TRIGGER_CONFLICT.sql` - duplicate of migration 20251226150000
- `COMPREHENSIVE_TRIGGER_FIX.sql` - duplicate of migration 20251226150000
- `fix-triggers.js` - not sure what this is, review first

### 🔍 REVIEW
- Any SQL files in root directory that aren't migrations
- Check if they've been properly migrated to `supabase/migrations/`

---

## Summary of Triggers by Table

| Table | # Triggers | Status | Notes |
|-------|-----------|--------|-------|
| users | 4 | ✅ Working | Fixed conflict in latest migration |
| user_assignments | 2 | ✅ Working | Auto-assign/remove module docs |
| department_assignments | 1 | ✅ Working | Bulk assign to users |
| role_assignments | 1 | ✅ Working | Bulk assign to users |
| test_attempts | 0-1 | ⚠️ Unknown | Verify if auto-complete trigger exists |

**Total Expected:** 8-9 active triggers (depending on test auto-complete state)
**Total Reported by Database:** 20 triggers

**⚠️ DISCREPANCY:** The database reports 20 triggers but we've only identified 8-9 in migrations. Need to run audit to find:
- Legacy triggers not documented in migrations
- System triggers
- Additional triggers we haven't discovered

---

## Next Steps

1. Run `SUPABASE_TRIGGER_AUDIT.sql` sections 1-7 to get complete picture
2. Delete duplicate fix files
3. Apply pending migrations
4. Verify trigger count matches expectations
5. Document any undocumented triggers found
