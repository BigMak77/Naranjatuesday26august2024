# Completed Training Preservation - Implementation Summary

## Overview

Fixed the system so that **completed training travels with users** throughout their career, regardless of role changes. Previously, ALL user assignments (including completed ones) were being deleted when users changed roles.

## Changes Made

### 1. API Routes - Preserve Completed Assignments

#### `src/app/api/change-user-role-assignments/route.ts`

**Before:**
```typescript
// Deleted ALL assignments when role changed
const { count: removedCount } = await supabase
  .from("user_assignments")
  .delete({ count: "exact" })
  .eq("auth_id", user.auth_id);
```

**After:**
```typescript
// Only delete INCOMPLETE assignments (preserve completed training)
const { count: removedCount } = await supabase
  .from("user_assignments")
  .delete({ count: "exact" })
  .eq("auth_id", user.auth_id)
  .is("completed_at", null); // Only delete incomplete
```

**Additional Logic Added:**
- Check for existing completed assignments before inserting new ones
- Skip duplicates (assignments that already exist with completion dates)
- Restore completion dates from `user_training_completions` for previously completed items

#### `src/app/api/update-user-role-assignments/route.ts`

Same changes applied:
- Only delete incomplete assignments when removing old role assignments
- Preserve all completed training

### 2. UserRoleHistory Component - Show All Completed Training

#### `src/components/roles/UserRoleHistory.tsx`

**Before:**
- Fetched only assignments that were part of the old role
- Limited to what `role_assignments` said should be assigned
- Missed training completed in other roles

**After:**
- Fetches **ALL** completed assignments for the user (from `user_assignments`)
- Also pulls from `user_training_completions` for historical data
- Combines and deduplicates the data
- Shows complete training history across all roles

**UI Changes:**
- Changed header from "Historical Assignments for {role}" to "Completed Training History for {user}"
- Added description: "All completed training modules and documents (travels with the user across all roles)"
- Simplified table to show: Type, Item, Completed At
- Removed Status and Assigned At columns (all shown items are completed)

### 3. Table Relationships

The system now properly uses three tables:

1. **`user_assignments`** - Current AND historical completed assignments
   - Incomplete assignments are removed on role change
   - Completed assignments stay forever

2. **`user_training_completions`** - Permanent completion records
   - Backup/archive of all completions
   - Used to restore completion dates if training is reassigned

3. **`user_role_history`** - Audit trail of role changes
   - Links to user's completed training via auth_id

## Benefits

✅ **Compliance**: Complete audit trail of all training ever completed
✅ **User Experience**: Users don't need to retake training they've already done
✅ **Data Integrity**: No loss of completion data during role changes
✅ **Flexibility**: Training can be reassigned to new roles without losing history
✅ **Reporting**: Accurate historical data for compliance reporting

## How It Works - Example Scenario

### Before the Fix:
1. User completes "Fire Safety" module in Role A
2. User changes to Role B
3. ❌ "Fire Safety" completion is **deleted** from user_assignments
4. ❌ User has to retake "Fire Safety" if it's assigned to Role B

### After the Fix:
1. User completes "Fire Safety" module in Role A
2. Saved to both `user_assignments` AND `user_training_completions`
3. User changes to Role B
4. ✅ "Fire Safety" completion stays in `user_assignments`
5. ✅ If Role B requires "Fire Safety", completion date is preserved
6. ✅ UserRoleHistory shows "Fire Safety" in completed training list

## Data Flow

```
User Completes Training
    ↓
1. Mark completed_at in user_assignments
    ↓
2. Save to user_training_completions (permanent record)
    ↓
User Changes Role
    ↓
3. Delete ONLY incomplete assignments from user_assignments
    ↓
4. Keep ALL completed assignments
    ↓
5. Add new role's assignments
    ↓
6. If new role includes previously completed items:
   - Check user_training_completions
   - Restore completion date automatically
    ↓
UserRoleHistory Component
    ↓
7. Show ALL completed training across all roles
```

## Files Modified

1. ✅ `src/app/api/change-user-role-assignments/route.ts`
2. ✅ `src/app/api/update-user-role-assignments/route.ts`
3. ✅ `src/components/roles/UserRoleHistory.tsx`

## Additional Issue Found

### RLS Policy Issue on role_assignments

**Error:** `403 - new row violates row-level security policy for table "user_assignments"`
(Actually happening on `role_assignments`, not `user_assignments`)

**Solution Created:**
- `scripts/fix-role-assignments-rls.sql` - SQL script to fix RLS policies
- `scripts/run-fix-role-assignments-rls.js` - Node script to run the fix
- `FIX_ROLE_ASSIGNMENTS_RLS.md` - Instructions for applying the fix

**To Apply:**
```bash
psql "$DATABASE_URL" -f scripts/fix-role-assignments-rls.sql
```

Or via Supabase Dashboard SQL Editor.

## Testing Recommendations

1. **Test Role Change with Completed Training:**
   - Assign training to Role A
   - Have user complete some training
   - Change user to Role B
   - Verify completed training still shows in user_assignments
   - Verify UserRoleHistory shows all completions

2. **Test Duplicate Prevention:**
   - User completes "Module X" in Role A
   - Change to Role B (which also has "Module X")
   - Verify no duplicate assignment created
   - Verify completion date preserved

3. **Test Historical Completions:**
   - Open UserRoleHistory component
   - Expand a user's role change entry
   - Verify ALL completed training shows (not just old role's assignments)

4. **Test RLS Fix:**
   - Login as Admin
   - Go to Role Management
   - Try to assign modules/documents to a role
   - Verify no 403 error

## Migration Notes

**This is a non-destructive change.**

- No data is deleted
- Existing completed assignments remain untouched
- Only affects NEW role changes going forward
- No database schema changes required (uses existing tables)

## Rollback Plan

If you need to revert:

1. The old behavior was deleting ALL assignments
2. To rollback, remove the `.is("completed_at", null)` filter from both API routes
3. However, **this is not recommended** as it would start deleting completed training again

## Future Enhancements

Potential improvements:

1. **Add retention period** - Archive completions older than X years
2. **Completion history view** - Dedicated page showing all completions by user
3. **Training transcript** - Printable PDF of all completed training
4. **Re-certification tracking** - Auto-reassign training that expires
5. **Bulk operations** - Preserve completions during bulk role changes
6. **Analytics** - Dashboard showing training completion patterns across role changes
