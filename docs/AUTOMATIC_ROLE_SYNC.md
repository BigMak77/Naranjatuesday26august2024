# Automatic Role Assignment Sync System

## 🎯 Overview
This system automatically synchronizes user training assignments when their roles change, ensuring users always have the correct training materials for their current position.

## 🚨 Problem Solved
**ISSUE**: When users moved to different roles, they kept assignments from their previous role AND got new assignments, creating confusion and compliance issues.

**SOLUTION**: Complete assignment cleanup and replacement - users only get assignments relevant to their current role.

## 🔧 Components

### 1. **Core Sync API** (`/api/sync-training-from-profile`)
- Syncs training assignments for a specific role
- Handles deduplication and batch processing
- Used as foundation for all sync operations

### 2. **Role Change API** (`/api/change-user-role-assignments`) 
- **REMOVES ALL existing assignments** (clean slate)
- Updates user's role in database
- Adds assignments for new role only
- Logs changes for audit trail
- Prevents assignment accumulation from multiple roles

### 3. **Utility Functions** (`/src/utils/roleAssignmentSync.ts`)
- `updateUserRole()` - Safe role updates with auto-sync
- `syncUserRoleChange()` - Manual sync trigger
- `batchSyncAllUsers()` - Bulk maintenance sync

### 4. **Database Triggers** (`/db/auto-role-sync-triggers.sql`)
- Automatic database-level sync
- Triggers on user role_id changes
- Creates audit log table
- Provides manual sync functions

### 5. **Maintenance Scripts**
- `auto-sync-all-roles.js` - Sync all roles
- Scheduled maintenance functions

## 🚀 How It Works

### Automatic Triggers
1. **User role changes** → Database trigger fires
2. **ALL assignments removed** → Complete cleanup (not just old role)
3. **New assignments added** → Based on new role only
4. **Change logged** → For audit purposes
5. **Result** → User has only assignments relevant to current role

### Manual Integration
```typescript
// In your user management code:
import { updateUserRole } from '@/utils/roleAssignmentSync';

// This automatically handles assignment sync
await updateUserRole(userId, newRoleId);
```

### API Integration
```typescript
// Direct API call - removes ALL old assignments
const response = await fetch('/api/change-user-role-assignments', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'user-uuid',
    new_role_id: 'new-role-uuid'
  })
});

// Response includes cleanup details:
// {
//   assignments_removed: 15,  // All old assignments cleaned up
//   assignments_added: 8,     // Only new role assignments
//   old_role_id: 'uuid1',
//   new_role_id: 'uuid2'
// }
```

## 📋 Setup Instructions

### 1. Database Setup
```sql
-- Run in Supabase SQL editor
\i db/auto-role-sync-triggers.sql
```

### 2. Application Integration
```typescript
// Replace direct role updates with:
await updateUserRole(userId, newRoleId);

// Instead of:
await supabase.from('users').update({ role_id: newRoleId }).eq('id', userId);
```

### 3. Scheduled Maintenance (Optional)
```typescript
// Run periodically (daily/weekly)
await batchSyncAllUsers();
```

## 🔍 Monitoring & Troubleshooting

### Check Role Change Log
```sql
SELECT * FROM user_role_change_log 
ORDER BY changed_at DESC 
LIMIT 20;
```

### Manual Sync Single User
```sql
SELECT manual_sync_user_assignments('user-uuid-here');
```

### Bulk Sync All Users
```sql
SELECT sync_all_user_assignments();
```

### API Health Check
```bash
curl -X POST http://localhost:3000/api/sync-training-from-profile \
  -H "Content-Type: application/json" \
  -d '{"role_id":"test-role-uuid"}'
```

## 📊 Expected Behavior

### Role Change Scenarios

1. **New Employee**
   - Assigned role → Training assignments created
   - No old assignments to remove

2. **Promotion/Transfer**
   - Role A → Role B
   - Role A assignments removed
   - Role B assignments added
   - Net change logged

3. **Department Restructure** 
   - Bulk role changes
   - All affected users auto-synced
   - Minimal manual intervention

### Performance Considerations
- **Batch processing** for large role changes
- **Deduplication** prevents assignment conflicts
- **Logging** enables troubleshooting
- **Triggers** ensure consistency

## ✅ Benefits

1. **Zero Manual Work** - Assignments update automatically
2. **Data Consistency** - No orphaned or missing assignments  
3. **Audit Trail** - Complete change history
4. **Scalable** - Handles individual changes or bulk updates
5. **Reliable** - Database triggers ensure no changes are missed

## 🎉 Result
Users automatically get the correct training assignments for their role, without any manual intervention. The system handles all edge cases and maintains complete data integrity.

Perfect for organizations with:
- Frequent role changes
- Complex training requirements  
- Compliance obligations
- Large user bases
