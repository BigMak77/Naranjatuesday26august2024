# Turkus Migration Plan - Executive Summary

## Quick Overview

**Goal:** Consolidate 8 turkus tables into 4 unified tables for better maintainability and consistency.

**Status:** Migration plan ready, pending execution

**Risk Level:** Low (backward compatible, non-destructive until final cleanup)

---

## What Changes

### Before (8 tables)
```
✅ Used:
  - turkus_tasks (task definitions)
  - turkus_assignments (task assignments)
  - turkus_risks (risk assessments)
  - turkus_risk_assignments (risk assignments)

❌ Unused:
  - turkus_non_conformances
  - turkus_schedules
  - turkus_submissions
  - turkus_submission_answers
```

### After (4 tables)
```
✅ Core Tables:
  - turkus_tasks (task definitions) - unchanged
  - turkus_risks (risk assessments) - unchanged
  - turkus_unified_assignments (NEW) - all assignments
  - turkus_items (NEW) - issues/non-conformances/audits
```

---

## Migration Files Created

### 📁 `/migrations/` folder

1. **`01-create-unified-turkus-schema.sql`**
   - Creates new unified tables
   - Non-destructive, safe to run

2. **`02-migrate-data-to-unified.sql`**
   - Copies data from old tables to new
   - Safe, handles duplicates

3. **`03-create-compatibility-views.sql`**
   - Creates views matching old table structure
   - Allows existing code to work unchanged

4. **`04-create-helper-functions.sql`**
   - Creates convenient SQL functions
   - `assign_turkus_item()`, `get_user_turkus_assignments()`, etc.

5. **`05-cleanup-old-tables.sql`**
   - ⚠️ DESTRUCTIVE - Drops old tables
   - Only run after thorough testing

6. **`ROLLBACK-unified-turkus.sql`**
   - Emergency rollback script
   - Removes unified tables, restores structure

7. **`README.md`**
   - Complete migration guide
   - Examples, troubleshooting, timeline

### 📁 `/src/types/` folder

- **`turkus-unified.ts`**
  - TypeScript types for new schema
  - Includes helper functions and type guards

---

## Quick Start

### Step 1: Backup
```bash
npx supabase db dump -f backup-$(date +%Y%m%d).sql
```

### Step 2: Run Migrations (Development/Staging First!)
```bash
npx supabase db execute --file migrations/01-create-unified-turkus-schema.sql
npx supabase db execute --file migrations/02-migrate-data-to-unified.sql
npx supabase db execute --file migrations/03-create-compatibility-views.sql
npx supabase db execute --file migrations/04-create-helper-functions.sql
```

### Step 3: Verify
```sql
-- Check data migrated correctly
SELECT
  'Tasks' as type,
  COUNT(*) as count
FROM turkus_unified_assignments
WHERE assignment_type = 'task'
UNION ALL
SELECT
  'Risks',
  COUNT(*)
FROM turkus_unified_assignments
WHERE assignment_type = 'risk';
```

### Step 4: Update Code (Gradually)
See `migrations/README.md` for detailed examples.

### Step 5: Cleanup (After 1-2 weeks)
```bash
# Edit file first to enable cleanup
npx supabase db execute --file migrations/05-cleanup-old-tables.sql
```

---

## Key Benefits

### 1. Single Source of Truth
All assignments in one table:
```sql
-- Get ALL user assignments (tasks, risks, issues, audits)
SELECT * FROM get_user_turkus_assignments('user-id');
```

### 2. Priority System
All assignments now have priority:
```typescript
priority: 'urgent' | 'high' | 'medium' | 'low'
```

### 3. Consistent Statuses
Same status values across all types:
```typescript
status: 'assigned' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
```

### 4. Flexible Metadata
Store type-specific data in JSONB:
```sql
metadata: {
  "custom_field": "value",
  "checklist": ["item1", "item2"]
}
```

### 5. Better Queries
```sql
-- Find all overdue assignments
SELECT * FROM get_overdue_turkus_assignments();

-- Get assignments by priority
SELECT * FROM turkus_unified_assignments
WHERE priority = 'urgent'
ORDER BY due_date;
```

---

## Code Update Example

### Before
```typescript
// Create task assignment
await supabase.from("turkus_assignments").insert({
  task_id: taskId,
  user_auth_id: userId,
  due_date: dueDate,
});

// Create risk assignment
await supabase.from("turkus_risk_assignments").insert({
  risk_id: riskId,
  auth_id: userId,
});
```

### After
```typescript
// Create any assignment with unified API
await supabase.rpc("assign_turkus_item", {
  p_assignment_type: "task", // or "risk", "issue", "audit"
  p_reference_id: taskId,
  p_assigned_to: userId,
  p_assigned_by: currentUserId,
  p_due_date: dueDate,
  p_priority: "high",
});
```

---

## Backward Compatibility

During transition, existing code works unchanged by using views:

```typescript
// Old code - still works!
supabase.from("turkus_assignments").select("*")

// Change to view temporarily
supabase.from("turkus_assignments_view").select("*")

// Eventually migrate to unified
supabase.from("turkus_unified_assignments")
  .select("*")
  .eq("assignment_type", "task")
```

---

## New Features Enabled

### 1. Unified Dashboard
Show all assignment types together:
```typescript
const assignments = await supabase
  .rpc("get_user_turkus_assignments", { p_user_auth_id: userId });

// Returns: tasks, risks, issues, audits all in one array
```

### 2. Cross-Type Reports
```sql
-- Assignments by type
SELECT assignment_type, COUNT(*)
FROM turkus_unified_assignments
GROUP BY assignment_type;

-- Overdue by department
SELECT d.name, COUNT(*)
FROM turkus_unified_assignments a
JOIN departments d ON a.department_id = d.id
WHERE a.status = 'overdue'
GROUP BY d.name;
```

### 3. Issues/Non-Conformances
Now properly supported with full workflow:
```typescript
// Create issue and assign it
await supabase.rpc("create_turkus_item", {
  p_item_type: "issue",
  p_title: "Safety hazard",
  p_description: "Wet floor",
  p_severity: "high",
  p_assign_to: userId,
  p_due_date: "2024-12-01",
});
```

---

## Timeline

| Week | Action | Risk |
|------|--------|------|
| 1 | Run migrations in dev/staging | Low |
| 2 | Deploy to production (keep old tables) | Low |
| 3-4 | Update code incrementally | Low |
| 5+ | Cleanup old tables (after verification) | Medium |

---

## Safety Features

✅ **Non-destructive** until step 5
✅ **Backward compatible** views provided
✅ **Rollback script** included
✅ **Duplicate handling** in migration
✅ **Data verification** queries provided
✅ **Type-safe** TypeScript types included

---

## Files to Review

1. **`migrations/README.md`** - Complete guide with examples
2. **`src/types/turkus-unified.ts`** - TypeScript types
3. **`migrations/01-*.sql`** through **`04-*.sql`** - Safe migrations
4. **`migrations/05-cleanup-old-tables.sql`** - Final cleanup (optional)

---

## Next Steps

1. ✅ Review this summary
2. ✅ Read `migrations/README.md` for details
3. ✅ Test in development environment
4. ✅ Run migrations 01-04 in staging
5. ✅ Update and test one component
6. ✅ Deploy to production
7. ✅ Monitor for 1-2 weeks
8. ✅ Run cleanup migration (optional)

---

## Questions to Answer

Before starting:
- [ ] Do you want to keep old tables as backup indefinitely?
- [ ] Should we start with just the schema or run full migration?
- [ ] Want to test in development first?
- [ ] Need help updating specific components?

**Ready to proceed?** Start with:
```bash
npx supabase db execute --file migrations/01-create-unified-turkus-schema.sql
```
