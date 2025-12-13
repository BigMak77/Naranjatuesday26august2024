# Module Inheritance Auto-Sync: Status & Required Fix

**Date:** December 13, 2025
**Status:** ⚠️ **Partial - Fix Required**

---

## Executive Summary

The module inheritance system is **mostly working**, but has a critical flaw in the department sync trigger that prevents automatic updates when users change departments.

### Current Status

✅ **What's Working:**
- Role-based module inheritance (when users change roles)
- Department-based module inheritance (when NEW modules added to departments)
- New user creation (gets both role and department training)
- All 516 users currently have correct assignments

❌ **What's Broken:**
- Department changes don't trigger auto-sync
- Trigger ignores user's direct `department_id` field
- 12 users have mismatched department IDs

---

## The Problem in Detail

### Issue 1: Department Trigger Ignores User's Direct Department

**Current Code:**
```sql
-- Looks at role's department only
SELECT department_id INTO dept_id
FROM roles
WHERE id = NEW.role_id;
```

**Problem:** All 516 users have a `department_id` field directly on the users table, but the trigger ignores it!

**When This Breaks:**
1. User moves from "Engineering" to "QA" department
2. Admin updates: `users.department_id = 'qa-dept-id'`
3. ❌ **Trigger doesn't fire** (only triggers on `role_id` changes)
4. User doesn't get QA department's training modules
5. Manual intervention required

### Issue 2: Trigger Only Fires on Role Changes

**Current Trigger:**
```sql
CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF role_id ON users  -- ❌ Only role_id!
```

**Should Be:**
```sql
CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id, role_id ON users  -- ✅ Both!
```

---

## Real-World Examples

### Example 1: Paul Test (Discovered in Investigation)

**User:** Paul Test (`7560b685-9c7e-44fa-909f-5248f6df61be`)

**Data:**
- User's `department_id`: Training Department
- Role's `department_id`: Different department
- **Result:** Trigger used wrong department, user missed module

**Fix Applied:** Manual backfill script added missing module

### Example 2: The 5 Users in "Mixing & Material Prep"

These users were in a department that had "Allergen Awareness" assigned, but they didn't inherit it. Likely scenarios:

1. Department assignment created BEFORE triggers were implemented
2. Users added to department before modules were assigned
3. Department changed but trigger didn't fire

**Fix Applied:** Manual backfill script added missing modules

---

## The Solution

### Migration File Created

**File:** `supabase/migrations/20251213_fix_department_training_sync.sql`

**Changes:**
1. ✅ Use user's direct `department_id` as primary source
2. ✅ Fall back to role's department if user has no direct department
3. ✅ Trigger on **both** `department_id` AND `role_id` changes
4. ✅ Maintain backward compatibility

### Before vs After

| Scenario | Before (Broken) | After (Fixed) |
|----------|----------------|---------------|
| User changes department | ❌ No sync | ✅ Auto-sync |
| User changes role | ✅ Sync (via role's dept) | ✅ Sync (better logic) |
| User created | ✅ Sync | ✅ Sync (better logic) |
| New module added to dept | ✅ Sync | ✅ Sync (no change) |

---

## How to Apply the Fix

### Quick Method (Recommended)

1. Open [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new)
2. Copy/paste SQL from `supabase/migrations/20251213_fix_department_training_sync.sql`
3. Click **Run**
4. ✅ Done!

### Verification After Fix

```bash
# Test by changing a user's department
npx tsx scripts/find-missed-users.ts
```

Should still show: `✅ All users have correct module assignments!`

---

## Current Module Inheritance Architecture

### Data Flow Diagram

```
USER CHANGES DEPARTMENT
          ↓
┌─────────────────────────────────────────┐
│ UPDATE users                            │
│ SET department_id = 'new-dept-id'       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ TRIGGER: After Update (department_id)   │
│ ❌ Currently: Only fires on role_id     │
│ ✅ After Fix: Fires on both             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ FUNCTION: sync_department_training()    │
│ ❌ Currently: Uses role's dept          │
│ ✅ After Fix: Uses user's dept          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Query department_assignments            │
│ WHERE department_id = user.dept_id      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ INSERT INTO user_assignments            │
│ (modules for new department)            │
│ ON CONFLICT DO NOTHING                  │
└─────────────────────────────────────────┘
```

---

## All Active Triggers (After Fix)

### Role-Based Sync
✅ **Trigger:** `trigger_sync_role_training_on_insert`
✅ **Event:** AFTER INSERT ON users
✅ **Action:** Assigns all role's modules to new user

✅ **Trigger:** `trigger_sync_role_training_on_update`
✅ **Event:** AFTER UPDATE OF role_id ON users
✅ **Action:** Assigns new role's modules when user changes role

✅ **Trigger:** `trigger_sync_new_role_assignment`
✅ **Event:** AFTER INSERT ON role_assignments
✅ **Action:** Assigns new module to all users with that role

### Department-Based Sync

✅ **Trigger:** `trigger_sync_department_training_on_insert`
✅ **Event:** AFTER INSERT ON users
✅ **Action:** Assigns all department's modules to new user

⚠️ **Trigger:** `trigger_sync_department_training_on_update` (NEEDS FIX)
❌ **Current:** AFTER UPDATE OF role_id ON users
✅ **Fixed:** AFTER UPDATE OF department_id, role_id ON users
⚠️ **Action:** Needs to use user's direct department_id

✅ **Trigger:** `trigger_sync_new_department_assignment`
✅ **Event:** AFTER INSERT ON department_assignments
✅ **Action:** Assigns new module to all users in that department

---

## Testing Scenarios (After Fix)

### Test 1: User Changes Department
```typescript
// Update user's department
await supabase
  .from('users')
  .update({ department_id: 'new-dept-uuid' })
  .eq('auth_id', 'user-auth-id');

// Expected: User automatically gets new department's modules
```

### Test 2: User Changes Role
```typescript
// Update user's role
await supabase
  .from('users')
  .update({ role_id: 'new-role-uuid' })
  .eq('auth_id', 'user-auth-id');

// Expected: User automatically gets new role's modules + new dept's modules (if role has dept)
```

### Test 3: New Module Added to Department
```typescript
// Assign module to department
await supabase
  .from('department_assignments')
  .insert({
    department_id: 'dept-uuid',
    item_id: 'module-uuid',
    type: 'module'
  });

// Expected: All users in that department automatically get the module
```

---

## Impact Analysis

### Users Affected
- **Total users:** 516
- **Users with direct department_id:** 516 (100%)
- **Users with mismatched dept/role:** 12
- **Users currently missing modules:** 0 (fixed via manual backfill)

### When Fix is Critical
This fix becomes critical when:
1. ✅ **Today:** Department assignments are already in use (62 dept-module assignments)
2. ✅ **Today:** Users have direct department_id set (all 516 users)
3. ⚠️ **Future:** Any time a user changes departments without changing roles
4. ⚠️ **Future:** Any reorganization that moves users between departments

---

## Recommendation

### Priority: **HIGH** 🔴

**Apply this fix immediately** to ensure that:
1. Future department changes trigger automatic training assignment
2. System behaves consistently with user expectations
3. No manual intervention needed when moving users between departments
4. Training compliance is maintained automatically

### Action Required

**Admin:** Apply the migration via Supabase Dashboard (2 minutes)
**File:** `supabase/migrations/20251213_fix_department_training_sync.sql`
**Verification:** Run `npx tsx scripts/find-missed-users.ts` afterward

---

## Files Created for This Fix

**Diagnostic Scripts:**
- [`scripts/check-department-model.ts`](scripts/check-department-model.ts) - Identified the problem
- [`scripts/find-missed-users.ts`](scripts/find-missed-users.ts) - Found the 6 affected users
- [`scripts/fix-missed-users.ts`](scripts/fix-missed-users.ts) - Fixed them (ran successfully)

**Migration:**
- [`supabase/migrations/20251213_fix_department_training_sync.sql`](supabase/migrations/20251213_fix_department_training_sync.sql) - The fix

**Documentation:**
- [`APPLY_DEPARTMENT_TRIGGER_FIX.md`](APPLY_DEPARTMENT_TRIGGER_FIX.md) - How to apply
- [`MODULE_INHERITANCE_FIX_COMPLETE.md`](MODULE_INHERITANCE_FIX_COMPLETE.md) - Previous fix summary
- This file - Complete status report

---

## Summary

✅ **Immediate:** All 516 users currently have correct training assignments
⚠️ **Issue:** Department changes won't auto-sync until trigger is fixed
✅ **Solution:** Migration file ready, just needs to be applied
🔴 **Priority:** HIGH - Apply before next department reorganization

**Bottom Line:** The system is working for now, but the trigger needs to be fixed to ensure it continues working when users change departments.
