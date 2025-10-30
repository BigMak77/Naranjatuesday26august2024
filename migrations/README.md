# Turkus Unified Schema Migration Guide

## Overview

This migration consolidates all turkus-related assignments (risks, tasks, audits, non-conformances, issues) into a unified schema with two core tables:

1. **`turkus_unified_assignments`** - Single source for all assignment types
2. **`turkus_items`** - Unified storage for issues, non-conformances, and audits

### Benefits

- ✅ Single source of truth for all assignments
- ✅ Consistent status tracking across all types
- ✅ Unified notification and reminder system
- ✅ Easier reporting across assignment types
- ✅ Simpler permission management
- ✅ Backward compatibility through views
- ✅ Type-safe with provided TypeScript types

## Tables Before Migration

### Currently Used (4 tables)
- `turkus_tasks` - Task definitions ✅ **KEEP**
- `turkus_risks` - Risk assessments ✅ **KEEP**
- `turkus_assignments` - Task assignments ⚠️ **MIGRATE → unified**
- `turkus_risk_assignments` - Risk assignments ⚠️ **MIGRATE → unified**

### Unused (4 tables)
- `turkus_non_conformances` ⚠️ **MIGRATE → turkus_items**
- `turkus_schedules` ❌ **DROP**
- `turkus_submissions` ❌ **DROP**
- `turkus_submission_answers` ❌ **DROP**

## Tables After Migration

### Core Tables
- `turkus_unified_assignments` - All assignments (NEW)
- `turkus_items` - Issues, non-conformances, audits (NEW)
- `turkus_tasks` - Task definitions (EXISTING)
- `turkus_risks` - Risk assessments (EXISTING)

### Compatibility Views
- `turkus_assignments_view` - Backward compatible view
- `turkus_risk_assignments_view` - Backward compatible view
- `turkus_non_conformances_view` - Backward compatible view

## Migration Steps

### Prerequisites

1. **Backup your database**
   ```bash
   # Using Supabase CLI
   npx supabase db dump -f backup-$(date +%Y%m%d).sql

   # Or using pg_dump
   pg_dump your_database > backup-$(date +%Y%m%d).sql
   ```

2. **Verify data counts**
   ```bash
   npx supabase db execute --file check-current-turkus-data.sql
   ```

### Step 1: Create Unified Schema

Run the first migration to create new tables and indexes.

```bash
npx supabase db execute --file migrations/01-create-unified-turkus-schema.sql
```

**What this does:**
- Creates `turkus_unified_assignments` table
- Creates `turkus_items` table
- Adds indexes for performance
- Creates update triggers
- **Does NOT modify existing tables**

**Safe to run:** ✅ Yes, creates new tables only

---

### Step 2: Migrate Data

Run the data migration to copy existing data into new tables.

```bash
npx supabase db execute --file migrations/02-migrate-data-to-unified.sql
```

**What this does:**
- Copies `turkus_risk_assignments` → `turkus_unified_assignments`
- Copies `turkus_assignments` → `turkus_unified_assignments`
- Copies `turkus_non_conformances` → `turkus_items` + `turkus_unified_assignments`
- Handles duplicates safely with `ON CONFLICT DO NOTHING`
- Reports migration counts

**Safe to run:** ✅ Yes, reads existing data and inserts into new tables

**Verify the migration:**
```sql
-- Check counts match
SELECT COUNT(*) FROM turkus_assignments; -- Should match task assignments
SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'task';

SELECT COUNT(*) FROM turkus_risk_assignments; -- Should match risk assignments
SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'risk';
```

---

### Step 3: Create Compatibility Views

Run this to create views that match old table structures.

```bash
npx supabase db execute --file migrations/03-create-compatibility-views.sql
```

**What this does:**
- Creates `turkus_assignments_view` (looks like old `turkus_assignments`)
- Creates `turkus_risk_assignments_view` (looks like old `turkus_risk_assignments`)
- Creates `turkus_non_conformances_view` (looks like old `turkus_non_conformances`)

**Safe to run:** ✅ Yes, creates views only

**Why this matters:**
Your existing code can continue to work without modification during transition. Queries like:
```typescript
supabase.from("turkus_assignments").select("*")
```

Can be updated to:
```typescript
supabase.from("turkus_assignments_view").select("*")
```

And will return the same structure.

---

### Step 4: Create Helper Functions

Run this to create convenient functions for working with unified assignments.

```bash
npx supabase db execute --file migrations/04-create-helper-functions.sql
```

**What this does:**
- `assign_turkus_item()` - Assign any item type
- `complete_turkus_assignment()` - Mark assignment complete
- `start_turkus_assignment()` - Mark assignment in progress
- `get_user_turkus_assignments()` - Get user's assignments with full details
- `get_overdue_turkus_assignments()` - Find overdue assignments
- `create_turkus_item()` - Create and optionally assign items

**Safe to run:** ✅ Yes, creates functions only

**Example usage:**
```sql
-- Assign a risk to a user
SELECT assign_turkus_item(
  'risk',                    -- assignment_type
  'risk-uuid',              -- reference_id
  'user-auth-id',           -- assigned_to
  'manager-auth-id',        -- assigned_by
  'dept-uuid',              -- department_id
  '2024-12-31',            -- due_date
  'high'                    -- priority
);

-- Get all assignments for a user
SELECT * FROM get_user_turkus_assignments('user-auth-id');

-- Get overdue assignments
SELECT * FROM get_overdue_turkus_assignments();
```

---

### Step 5: Update Your Application Code

Now update your components to use the new unified schema.

#### Update imports

```typescript
// Add new types
import {
  TurkusUnifiedAssignment,
  TurkusItem,
  AssignmentType,
  CreateAssignmentRequest
} from '@/types/turkus-unified';
```

#### Example: Update task assignment component

**Before:**
```typescript
const { data } = await supabase
  .from("turkus_assignments")
  .select("*")
  .eq("user_auth_id", userId);
```

**After:**
```typescript
const { data } = await supabase
  .from("turkus_unified_assignments")
  .select("*")
  .eq("assigned_to", userId)
  .eq("assignment_type", "task");
```

**Or use the helper function:**
```typescript
const { data } = await supabase
  .rpc("get_user_turkus_assignments", {
    p_user_auth_id: userId,
    p_assignment_type: "task"
  });
```

#### Example: Create assignment

**Before:**
```typescript
await supabase.from("turkus_risk_assignments").insert({
  risk_id: riskId,
  auth_id: userId
});
```

**After:**
```typescript
await supabase.rpc("assign_turkus_item", {
  p_assignment_type: "risk",
  p_reference_id: riskId,
  p_assigned_to: userId,
  p_assigned_by: currentUserId,
  p_priority: "high"
});
```

See [Component Update Guide](#component-update-examples) below for detailed examples.

---

### Step 6: Test Thoroughly

1. **Test existing features**
   - Task assignments creation and listing
   - Risk assignments creation and listing
   - All existing workflows should work unchanged if using compatibility views

2. **Test new unified features**
   - Create assignments using helper functions
   - Query assignments across types
   - Test status updates and completion

3. **Verify data integrity**
   ```sql
   -- All old assignments should exist in new table
   SELECT
     (SELECT COUNT(*) FROM turkus_assignments) as old_task_assignments,
     (SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'task') as new_task_assignments,
     (SELECT COUNT(*) FROM turkus_risk_assignments) as old_risk_assignments,
     (SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'risk') as new_risk_assignments;
   ```

---

### Step 7: Cleanup (OPTIONAL - DESTRUCTIVE)

**⚠️ WARNING: This step is destructive and irreversible (without backups)**

Only run this after:
1. ✅ All data verified migrated correctly
2. ✅ All application code updated and tested
3. ✅ Running in production for at least a week successfully
4. ✅ Database backup confirmed working

```bash
npx supabase db execute --file migrations/05-cleanup-old-tables.sql
```

**What this does:**
- Drops `turkus_submission_answers`
- Drops `turkus_submissions`
- Drops `turkus_schedules`
- Drops `turkus_risk_assignments`
- Drops `turkus_assignments`
- Drops `turkus_non_conformances`
- Keeps `turkus_tasks` and `turkus_risks`

**Safety mechanism:**
The script requires you to uncomment a line to enable cleanup:
```sql
SET LOCAL turkus_migration_cleanup_enabled = 'true';
```

---

## Rollback Plan

If something goes wrong, you can rollback the migration:

```bash
npx supabase db execute --file migrations/ROLLBACK-unified-turkus.sql
```

**What this does:**
- Drops unified tables
- Drops views and functions
- Recreates original table structures
- **NOTE:** Does NOT restore data - you must restore from backup

**To fully rollback:**
1. Run rollback script
2. Restore from backup if needed:
   ```bash
   psql your_database < backup-20241029.sql
   ```

---

## Component Update Examples

### Example 1: Task Assignments Page

**File:** `src/app/turkus/assignments/page.tsx`

**Before:**
```typescript
// Fetch assignments
const { data } = await supabase
  .from("turkus_assignments")
  .select(`
    id,
    due_date,
    task:turkus_tasks (title),
    user:users (first_name, last_name, department_id)
  `);

// Create assignment
await supabase.from("turkus_assignments").insert({
  task_id: selectedTask,
  user_auth_id: selectedUser,
  department_id: user?.department_id,
  due_date: dueDate,
});
```

**After:**
```typescript
// Fetch assignments - Option 1: Direct query
const { data } = await supabase
  .from("turkus_unified_assignments")
  .select(`
    id,
    due_date,
    status,
    priority,
    reference_id,
    assigned_to
  `)
  .eq("assignment_type", "task");

// Then fetch related data
const taskIds = data?.map(a => a.reference_id) || [];
const userIds = data?.map(a => a.assigned_to) || [];

const [tasks, users] = await Promise.all([
  supabase.from("turkus_tasks").select("*").in("id", taskIds),
  supabase.from("users").select("*").in("auth_id", userIds),
]);

// Fetch assignments - Option 2: Use helper function
const { data } = await supabase
  .rpc("get_user_turkus_assignments", {
    p_user_auth_id: userId,
    p_assignment_type: "task"
  });
// Returns: id, title, description, status, priority, due_date, department_name, metadata

// Create assignment - Option 1: Direct insert
await supabase.from("turkus_unified_assignments").insert({
  assignment_type: "task",
  reference_id: selectedTask,
  assigned_to: selectedUser,
  assigned_by: currentUser.auth_id,
  department_id: user?.department_id,
  due_date: dueDate,
  priority: "medium",
});

// Create assignment - Option 2: Use helper function
await supabase.rpc("assign_turkus_item", {
  p_assignment_type: "task",
  p_reference_id: selectedTask,
  p_assigned_to: selectedUser,
  p_assigned_by: currentUser.auth_id,
  p_department_id: user?.department_id,
  p_due_date: dueDate,
  p_priority: "medium",
});
```

---

### Example 2: Risk Assessment Manager

**File:** `src/components/healthsafety/RiskAssessmentManager.tsx`

**Before:**
```typescript
// Assign risk
await supabase.from("turkus_risk_assignments").insert({
  risk_id: selectedId,
  auth_id: assignUserId,
});
```

**After:**
```typescript
// Assign risk - Option 1: Direct insert
await supabase.from("turkus_unified_assignments").insert({
  assignment_type: "risk",
  reference_id: selectedId,
  assigned_to: assignUserId,
  assigned_by: currentUser.auth_id,
  priority: "high", // Can now add priority!
});

// Assign risk - Option 2: Use helper function
await supabase.rpc("assign_turkus_item", {
  p_assignment_type: "risk",
  p_reference_id: selectedId,
  p_assigned_to: assignUserId,
  p_assigned_by: currentUser.auth_id,
  p_priority: "high",
});
```

---

### Example 3: Create New Issue

**New functionality enabled by unified schema:**

```typescript
// Create an issue and assign it in one operation
const { data: itemId } = await supabase.rpc("create_turkus_item", {
  p_item_type: "issue",
  p_title: "Safety hazard in warehouse",
  p_description: "Wet floor without signage",
  p_department_id: departmentId,
  p_severity: "high",
  p_created_by: currentUser.auth_id,
  p_assign_to: assigneeId,
  p_due_date: "2024-12-01",
});
```

---

### Example 4: Dashboard - Get All Assignments

**New functionality: Cross-type queries**

```typescript
// Get all types of assignments for a user
const { data: assignments } = await supabase
  .rpc("get_user_turkus_assignments", {
    p_user_auth_id: userId,
  });

// Returns unified view:
// [
//   { assignment_type: "task", title: "Complete training", status: "assigned", ... },
//   { assignment_type: "risk", title: "Review risk assessment", status: "in_progress", ... },
//   { assignment_type: "issue", title: "Fix safety issue", status: "overdue", ... },
// ]

// Get only overdue assignments
const { data: overdue } = await supabase
  .from("turkus_unified_assignments")
  .select("*")
  .eq("assigned_to", userId)
  .lt("due_date", new Date().toISOString())
  .in("status", ["assigned", "in_progress"]);

// Or use helper function
const { data: overdue } = await supabase.rpc("get_overdue_turkus_assignments");
```

---

## New Features Enabled

### 1. Unified Dashboard

Show all assignment types in one place:

```typescript
const { data } = await supabase.rpc("get_user_turkus_assignments", {
  p_user_auth_id: userId,
});

// Group by type
const groupedAssignments = {
  tasks: data.filter(a => a.assignment_type === "task"),
  risks: data.filter(a => a.assignment_type === "risk"),
  issues: data.filter(a => a.assignment_type === "issue"),
};
```

### 2. Priority-Based Sorting

All assignments now have priority:

```typescript
const { data } = await supabase
  .from("turkus_unified_assignments")
  .select("*")
  .eq("assigned_to", userId)
  .order("priority", { ascending: false }) // urgent, high, medium, low
  .order("due_date", { ascending: true });
```

### 3. Consistent Status Tracking

All types use same statuses: `assigned`, `in_progress`, `completed`, `overdue`, `cancelled`

```typescript
// Mark any assignment as in progress
await supabase.rpc("start_turkus_assignment", {
  p_assignment_id: assignmentId,
});

// Complete any assignment
await supabase.rpc("complete_turkus_assignment", {
  p_assignment_id: assignmentId,
  p_notes: "Completed successfully",
});
```

### 4. Flexible Metadata

Store type-specific data in JSON:

```typescript
await supabase.from("turkus_unified_assignments").insert({
  assignment_type: "audit",
  reference_id: auditId,
  assigned_to: userId,
  metadata: {
    audit_checklist: ["item1", "item2"],
    custom_field: "value",
  },
});
```

---

## Testing Checklist

### Pre-Migration
- [ ] Database backup created
- [ ] Data counts recorded
- [ ] Test environment setup

### During Migration
- [ ] Step 1 completed (schema created)
- [ ] Step 2 completed (data migrated)
- [ ] Data counts match before/after
- [ ] Step 3 completed (views created)
- [ ] Step 4 completed (functions created)
- [ ] Compatibility views return correct data

### Post-Migration
- [ ] Existing task assignments work
- [ ] Existing risk assignments work
- [ ] Can create new assignments
- [ ] Can update assignment status
- [ ] Can complete assignments
- [ ] Overdue detection works
- [ ] Priority filtering works
- [ ] All components updated
- [ ] TypeScript types added
- [ ] No console errors in app

### Before Cleanup
- [ ] Running in production for 1+ week
- [ ] No issues reported
- [ ] All features working correctly
- [ ] Fresh backup created
- [ ] Rollback plan tested

---

## Support & Troubleshooting

### Common Issues

**Issue: Foreign key constraint errors**
```
ERROR: insert or update on table "turkus_unified_assignments" violates foreign key constraint
```
**Solution:** Ensure `assigned_to` user exists in `users` table with matching `auth_id`.

**Issue: Data counts don't match**
```
Old table: 100 rows
New table: 95 rows
```
**Solution:** Check for NULL values in key columns. Migration skips rows with NULL `task_id` or `user_auth_id`.

**Issue: Views not returning data**
```
SELECT * FROM turkus_assignments_view; -- Returns empty
```
**Solution:** Ensure Step 2 (data migration) completed successfully. Check `turkus_unified_assignments` table directly.

### Verification Queries

```sql
-- Check migration status
SELECT
  'Risk Assignments' as type,
  (SELECT COUNT(*) FROM turkus_risk_assignments) as old_count,
  (SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'risk') as new_count
UNION ALL
SELECT
  'Task Assignments',
  (SELECT COUNT(*) FROM turkus_assignments),
  (SELECT COUNT(*) FROM turkus_unified_assignments WHERE assignment_type = 'task');

-- Find orphaned assignments (assigned_to user doesn't exist)
SELECT * FROM turkus_unified_assignments a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.auth_id = a.assigned_to);

-- Check for NULL values that would cause issues
SELECT
  COUNT(*) FILTER (WHERE reference_id IS NULL) as null_reference_ids,
  COUNT(*) FILTER (WHERE assigned_to IS NULL) as null_assigned_to,
  COUNT(*) FILTER (WHERE assignment_type IS NULL) as null_assignment_types
FROM turkus_unified_assignments;
```

---

## Timeline Recommendation

### Week 1: Preparation
- Review migration files
- Create database backup
- Run Steps 1-4 in development/staging
- Test thoroughly

### Week 2: Soft Launch
- Run Steps 1-4 in production
- Monitor for errors
- Keep old tables as backup
- Use compatibility views

### Week 3-4: Code Updates
- Update components incrementally
- Transition from views to direct queries
- Deploy updated code gradually

### Week 5+: Cleanup
- After 1-2 weeks of stability
- Create fresh backup
- Run Step 5 (cleanup)
- Monitor for any issues

---

## Questions?

- Check the SQL files in `/migrations/` for detailed comments
- Review TypeScript types in `/src/types/turkus-unified.ts`
- Test queries in Supabase SQL Editor before running in app
- Keep backups until confident in migration success
