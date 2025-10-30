# Turkus Unified Assignments Implementation Guide

## Executive Summary

You have **8 turkus tables** in your database, but only **4 are actively used** in your codebase. I've created a unified assignment table solution that consolidates assignment logic across all turkus modules while maintaining backward compatibility.

## Current State Analysis

### ✅ **ACTIVELY USED TABLES**
1. **`turkus_risks`** - Risk assessment data (RiskAssessmentManager.tsx)
2. **`turkus_risk_assignments`** - Risk assignments (RiskAssessmentManager.tsx) 
3. **`turkus_tasks`** - Task definitions (assignments/page.tsx)
4. **`turkus_assignments`** - Task assignments (assignments/page.tsx)

### ❌ **UNUSED TABLES** 
5. **`turkus_non_conformances`** - Non-conformance tracking (not implemented)
6. **`turkus_schedules`** - Recurring task scheduling (not implemented)
7. **`turkus_submissions`** - Task completion tracking (not implemented)
8. **`turkus_submission_answers`** - Detailed audit responses (not implemented)

## Unified Solution: `turkus_unified_assignments`

### Core Design
- **Single table** handles all assignment types: `risk`, `task`, `audit`, `non_conformance`, `issue`
- **Polymorphic design** using `assignment_type` + `reference_id` pattern
- **Rich metadata** with JSONB for type-specific data
- **Common features**: priority, status, due dates, notes, completion tracking

### Key Features
1. **Backward Compatibility**: Views maintain existing queries
2. **Helper Functions**: Simplified assignment operations
3. **Flexible Schema**: Easy to add new assignment types
4. **Performance Optimized**: Proper indexing strategy
5. **Data Migration**: Automated migration from existing tables

## Implementation Files Created

### 1. `turkus-unified-assignments-migration.sql`
Complete migration script including:
- Unified table creation with constraints and indexes
- Data migration from existing tables
- Backward compatibility views
- Helper functions for common operations
- Sample usage queries

### 2. `get-all-turkus-data.sql` 
Simple query to inspect table structures:
```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name LIKE 'turkus%'
ORDER BY table_name, ordinal_position;
```

## Migration Benefits

### Before (Current State)
```typescript
// Risk assignments
await supabase.from("turkus_risk_assignments").insert({
  risk_id: selectedId,
  auth_id: assignUserId,
});

// Task assignments  
await supabase.from("turkus_assignments").insert({
  task_id: selectedTask,
  user_auth_id: selectedUser,
  department_id: user?.department_id,
  due_date: dueDate,
});
```

### After (Unified Approach)
```typescript
// Any assignment type
await supabase.rpc('assign_turkus_item', {
  p_assignment_type: 'risk', // or 'task', 'audit', etc.
  p_reference_id: selectedId,
  p_assigned_to: assignUserId,
  p_department_id: departmentId,
  p_due_date: dueDate,
  p_priority: 'high'
});
```

## Implementation Steps

### Phase 1: Database Migration
1. Run `turkus-unified-assignments-migration.sql`
2. Verify data migration with provided queries
3. Test backward compatibility views

### Phase 2: Code Updates (Optional, views provide compatibility)
1. Update `RiskAssessmentManager.tsx` to use unified table
2. Update `assignments/page.tsx` to use unified table  
3. Add new assignment types as needed

### Phase 3: Feature Expansion
1. Implement audit assignments
2. Add non-conformance assignments
3. Build issue tracking assignments
4. Create unified dashboard

## Sample Usage

### Get User's All Assignments
```sql
SELECT * FROM get_user_turkus_assignments('user-auth-id');
```

### Assign a Risk with Priority
```sql
SELECT assign_turkus_item('risk', 'risk-uuid', 'user-auth-id', 'assigner-id', 'dept-id', '2024-12-01', 'urgent');
```

### Complete an Assignment
```sql
SELECT complete_turkus_assignment('assignment-uuid', 'Completed successfully');
```

### Get Overdue Items
```sql  
SELECT * FROM turkus_unified_assignments 
WHERE status IN ('assigned', 'in_progress') 
  AND due_date < now()
ORDER BY due_date;
```

## Risk Mitigation

- **Zero Downtime**: Views ensure existing code continues working
- **Gradual Migration**: Update components one at a time
- **Rollback Plan**: Keep old tables until migration proven
- **Data Integrity**: Migration preserves all existing data
- **Performance**: Proper indexing maintains query speed

## Next Steps

1. **Review the migration SQL** in `turkus-unified-assignments-migration.sql`
2. **Test in development** environment first
3. **Run the migration** when ready
4. **Gradually update** frontend components to use new patterns
5. **Add new assignment types** as business needs arise

## Questions?

The unified table design supports your goal of having "one table that will handle all turkus_assignments (risks, non-conformances, issues, tasks, audits)" while maintaining all existing functionality and providing a path for future expansion.
