# EMERGENCY USER ASSIGNMENT FIX

## 🚨 Critical Issue Template
When a user has moved roles but their training assignments haven't been automatically updated, this causes a mismatch between their current role requirements and actual assignments.

## 🔧 Immediate Solution

### Step 1: Run Emergency Fix
Execute the emergency fix SQL script to immediately resolve the user's assignments:

```bash
psql $DATABASE_URL -f db/emergency-user-fix.sql
```

This script will:
- ✅ Analyze current vs expected assignments
- 🗑️ Remove all existing assignments for the user
- ➕ Add new assignments based on current role
- 📝 Log the fix in audit_log table

### Step 2: Create Automatic Trigger
Prevent future occurrences by creating a database trigger:

```bash
psql $DATABASE_URL -f db/create-auto-sync-trigger.sql
```

This creates a trigger that automatically:
- 🔄 Detects when a user's role_id changes
- 🧹 Removes all old assignments
- ➕ Adds new assignments for the new role
- 📊 Logs all changes in audit_log

### Step 3: Test Everything
Run comprehensive tests to verify the fix works:

```bash
psql $DATABASE_URL -f db/comprehensive-test.sql
```

## 🛡️ How It Prevents Future Issues

### Automatic Role Sync Trigger
The database trigger `sync_user_assignments_on_role_change()` will:

1. **Detect Changes**: Monitors `UPDATE` operations on the `users` table
2. **Compare Roles**: Only activates when `role_id` actually changes
3. **Clean Slate**: Removes ALL existing assignments for the user
4. **Fresh Start**: Adds assignments based on the new role
5. **Audit Trail**: Logs every change for accountability

### API Integration
The existing APIs will now work seamlessly:
- `/api/change-user-role-assignments` - Complete role change with cleanup
- `/api/update-user-role-assignments` - Alternative role update
- `/api/sync-training-from-profile` - Role-based sync

## 📊 Expected Results

### Before Fix
```
User: [USER_ID_HERE]
Current Role: [New Role ID]
Assignments: [Old count - likely wrong]
Status: 🚨 MISMATCH
```

### After Fix
```
User: [USER_ID_HERE]
Current Role: [New Role ID]
Assignments: [Correct count matching role requirements]
Status: ✅ SYNCED
```

## 🎯 Files Created

### Database Scripts
- `db/emergency-user-fix.sql` - Immediate fix for the specific user
- `db/create-auto-sync-trigger.sql` - Automatic trigger for future prevention
- `db/comprehensive-test.sql` - Complete testing suite

### API Endpoints
- `src/app/api/emergency-fix-user/route.ts` - Emergency fix API endpoint

### Utility Scripts
- `scripts/emergency-fix-user-assignments.js` - Node.js version of the fix
- `scripts/generate-emergency-sql.js` - SQL generator script

## ⚡ Quick Commands

### Emergency Fix (Run This First)
```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"
psql $DATABASE_URL -f db/emergency-user-fix.sql
```

### Create Prevention Trigger
```bash
psql $DATABASE_URL -f db/create-auto-sync-trigger.sql
```

### Verify Everything Works
```bash
psql $DATABASE_URL -f db/comprehensive-test.sql
```

## 🔍 Monitoring

### Check User Status
```sql
SELECT 
    u.id,
    u.role_id,
    r.name as role_name,
    (SELECT COUNT(*) FROM user_assignments ua WHERE ua.auth_id = u.auth_id) as assignments,
    (SELECT COUNT(*) FROM role_assignments ra WHERE ra.role_id = u.role_id) as expected
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.id = 'YOUR_USER_ID_HERE';
```

### Check Audit Trail
```sql
SELECT operation, old_values, new_values, timestamp
FROM audit_log 
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY timestamp DESC;
```

## 🎉 Success Criteria

- ✅ User has correct number of assignments matching their current role
- ✅ Database trigger is active and working
- ✅ Future role changes automatically sync assignments
- ✅ All changes are logged in audit_log table
- ✅ No more manual intervention needed for role changes

This emergency fix resolves the immediate issue and prevents it from happening again!
