# user_assignments Table Analysis Report

## Actual Database Schema

Based on querying the live database, here are the **actual columns** in the `user_assignments` table:

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | UUID | No | Primary key |
| `auth_id` | UUID | No | User authentication ID |
| `item_id` | UUID | No | Module or document ID |
| `item_type` | String | No | "module" or "document" |
| `opened_at` | Timestamp | Yes | When user opened the item |
| `completed_at` | Timestamp | Yes | When training was completed |
| `assigned_at` | Timestamp | Yes | When assignment was created |
| `assigned_by` | UUID | Yes | Who assigned it |
| `due_at` | Timestamp | Yes | Due date for completion |
| `origin_type` | String | Yes | Source of assignment |
| `origin_id` | UUID | Yes | ID of source record |
| `is_archived` | Boolean | No | Archive flag |
| `follow_up_due_date` | Timestamp | Yes | Follow-up assessment due date |
| `follow_up_completed_at` | Timestamp | Yes | Follow-up completion date |
| `follow_up_required` | Boolean | No | Requires follow-up flag |

Sample Record Count: **197 records**

---

## Code vs Database Comparison

### ✅ Columns That EXIST and ARE USED Correctly

These columns exist in the database and are properly used in the code:

- `id` ✅ **WIDELY USED** in:
  - TrainerView.tsx:393 - tracking incomplete assignments
  - AssignedToTab.tsx:50 - audit assignment management
  - MyTeamTraining.tsx:56 - team training dashboard
  - TrainingAssessment.tsx:50 - follow-up assessments
  - And 15+ other components
- `auth_id` ✅
- `item_id` ✅
- `item_type` ✅
- `opened_at` ✅ **IS USED** in:
  - UserTrainingDashboard.tsx:93
  - AssignedToTab.tsx:55
- `assigned_at` ✅
- `completed_at` ✅
- `due_at` ✅
- `follow_up_required` ✅
- `follow_up_due_date` ✅
- `follow_up_completed_at` ✅

---

### ❌ **CRITICAL ISSUES: Columns Code Expects But DON'T EXIST**

#### Issue #1: `role_assignment_id` - DOES NOT EXIST ❌

**Files that use this non-existent column:**

1. **`src/app/api/update-user-role-assignments/route.ts:60`**
   ```typescript
   .delete()
   .eq("auth_id", user.auth_id)
   .in("role_assignment_id", oldRoleAssignmentIds)  // ❌ WILL FAIL
   ```
   **Impact**: DELETE operations will fail with "column does not exist" error

2. **`src/app/api/sync-training-from-profile/route.ts:74`**
   ```typescript
   .select("auth_id, role_assignment_id")  // ❌ WILL FAIL
   ```
   **Impact**: SELECT will fail, breaking sync functionality

3. **`src/app/api/sync-training-from-profile/route.ts:66`**
   ```typescript
   {
     auth_id: user.auth_id,
     item_id: item_id,
     item_type: a.type,
     role_assignment_id: a.id,  // ❌ Column doesn't exist
     assigned_at: new Date().toISOString()
   }
   ```
   **Impact**: INSERT will fail or silently ignore this field

4. **`src/app/api/change-user-role-assignments/route.ts`** (multiple locations)
   - Uses `role_assignment_id` in filtering logic
   **Impact**: Queries will fail

#### Issue #2: `created_at` - DOES NOT EXIST ❌

**Files that use this non-existent column:**

1. **`src/components/training/MyTeamTraining.tsx:56`**
   ```typescript
   .select("id, auth_id, item_id, item_type, completed_at, due_at, created_at")
   ```
   **Impact**: SELECT will fail with "column does not exist" error

---

### ⚠️ Columns That EXIST But Are UNDERUTILIZED

These columns exist in the database but are rarely used in the code:

- `assigned_by` - Who assigned it (NOT USED anywhere)
- `origin_type` - Source of assignment (NOT USED anywhere)
- `origin_id` - ID of source record (NOT USED anywhere)
- `is_archived` - Archive flag (NOT USED anywhere)

**Potential issues:**
- Data is being stored but never queried
- Could be useful for audit trails, reports, or filtering
- May have business logic value that's not being utilized

---

## Required Fixes

### Fix #1: Add `role_assignment_id` Column

This column is heavily used in the code for tracking which role assignment created each user assignment. It's critical for role change operations.

**Migration SQL:**
```sql
-- Add role_assignment_id column
ALTER TABLE user_assignments
ADD COLUMN role_assignment_id UUID REFERENCES role_assignments(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_user_assignments_role_assignment_id
ON user_assignments(role_assignment_id);

-- Add comment
COMMENT ON COLUMN user_assignments.role_assignment_id
IS 'Links to the role_assignment record that created this user assignment';
```

**Affected Files That Need This Column:**
- `src/app/api/update-user-role-assignments/route.ts`
- `src/app/api/sync-training-from-profile/route.ts`
- `src/app/api/change-user-role-assignments/route.ts`

---

### Fix #2: Replace `created_at` with `assigned_at`

The code is looking for `created_at` but the table uses `assigned_at` for the same purpose.

**File to Fix:**
- `src/components/training/MyTeamTraining.tsx:56`

**Change:**
```typescript
// BEFORE (incorrect):
.select("id, auth_id, item_id, item_type, completed_at, due_at, created_at")

// AFTER (correct):
.select("id, auth_id, item_id, item_type, completed_at, due_at, assigned_at")
```

---

### Fix #3: Consider Using Additional Columns

These columns exist but are underutilized. Consider if they should be used more:

1. **`opened_at`** - Currently used in 2 files, could be used more widely
   - Already tracked in UserTrainingDashboard and AssignedToTab
   - Could be added to more reports for engagement metrics

2. **`assigned_by`** - Tracks who made the assignment (NOT USED)
   - Useful for audit trails
   - Could help with accountability

3. **`origin_type` / `origin_id`** - Tracks source of assignment
   - Could distinguish between manual assignments vs role-based
   - Useful for understanding assignment patterns

4. **`is_archived`** - Archive flag
   - Could be used to soft-delete assignments
   - Useful for historical tracking

---

## Action Items

### Critical (Must Fix)
1. ✅ **Add `role_assignment_id` column** to database
2. ✅ **Fix MyTeamTraining.tsx** to use `assigned_at` instead of `created_at`

### High Priority
3. **Audit all API routes** that use `role_assignment_id` to ensure they handle null values
4. **Test role change operations** after adding the column

### Medium Priority
5. **Consider using `opened_at`** for better tracking of user engagement
6. **Add `assigned_by`** to audit logs and admin views
7. **Document unused columns** or remove them if truly unnecessary

### Low Priority
8. **Review `origin_type/origin_id`** to see if they serve a purpose
9. **Implement `is_archived`** functionality if soft-deletes are needed

---

## Summary

**Total Issues Found: 2 Critical**

1. ❌ **`role_assignment_id`** column is used in 4+ files but DOES NOT EXIST in database
   - This will cause runtime errors in role management operations
   - **Must be added to database**

2. ❌ **`created_at`** column is queried but DOES NOT EXIST (should use `assigned_at`)
   - This will cause SELECT query failures
   - **Must be fixed in MyTeamTraining.tsx**

**Risk Level:** 🔴 **HIGH** - Multiple API endpoints and components will fail

**Recommended Action:** Apply database migration and code fixes immediately.
