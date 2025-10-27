# Access Levels Migration Guide

## Overview

This guide helps you update the `access_level` column in your users table to support the new role-based toolbar system.

## New Access Levels

The system now supports 8 distinct access levels with a clear hierarchy:

| Access Level | Description | Department Scope | Shift Scope |
|-------------|-------------|------------------|-------------|
| **Super Admin** | Full system access, all features | All departments | All shifts |
| **Admin** | System administration | All departments | All shifts |
| **HR Admin** | Employee management | All departments | All shifts |
| **H&S Admin** | Health & Safety management | All departments | All shifts |
| **Dept. Manager** | Department-wide management | Single department | All shifts in dept |
| **Manager** | Shift-level management | Single department | Single shift only |
| **Trainer** | Training management | Assigned departments | N/A |
| **User** | Basic user access | Own data only | N/A |

## Migration Options

### Option 1: Run Node.js Script (Recommended)

**Prerequisites:**
- Node.js installed
- Supabase credentials in `.env.local`

**Steps:**
```bash
# 1. Make the script executable (optional)
chmod +x run-access-level-migration.js

# 2. Run the migration
node run-access-level-migration.js

# The script will:
# - Show current access level distribution
# - Map old values to new values
# - Ask for confirmation
# - Update all users
# - Show final distribution
```

**Advantages:**
- Interactive and safe
- Shows preview before updating
- Color-coded output
- Automatic mapping of common variations
- No SQL knowledge required

### Option 2: Run SQL Script

**Prerequisites:**
- PostgreSQL client (`psql`) installed
- Direct database URL or Supabase connection string

**Steps:**
```bash
# Get your database URL from .env.local
# It looks like: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Run the migration
psql "YOUR_DATABASE_URL" -f update-access-levels.sql

# Or with Supabase:
psql "$(grep DIRECT_URL .env.local | cut -d'=' -f2)" -f update-access-levels.sql
```

**Advantages:**
- Direct database control
- Can review SQL before running
- Creates automatic backup table
- Shows detailed migration steps

### Option 3: Manual Update via Supabase Dashboard

**Steps:**
1. Go to your Supabase project dashboard
2. Navigate to Table Editor → users table
3. Click on a user's `access_level` cell
4. Select or type one of the valid access levels:
   - `Super Admin`
   - `Admin`
   - `HR Admin`
   - `H&S Admin`
   - `Dept. Manager`
   - `Manager`
   - `Trainer`
   - `User`
5. Repeat for all users

**Advantages:**
- No code execution needed
- Visual interface
- Good for small user counts

**Disadvantages:**
- Time-consuming for many users
- Prone to typos
- No automatic mapping

## Access Level Mapping

The migration scripts automatically map common variations to the correct format:

| Old Value | Maps To |
|-----------|---------|
| `admin`, `administrator` | `Admin` |
| `super admin`, `superadmin` | `Super Admin` |
| `hr`, `hr admin`, `HR` | `HR Admin` |
| `h&s`, `hs admin`, `H&S` | `H&S Admin` |
| `dept manager`, `department manager` | `Dept. Manager` |
| `manager`, `shift manager` | `Manager` |
| `trainer`, `training admin` | `Trainer` |
| `user`, `employee`, `basic` | `User` |

## Verification

After migration, verify the changes:

### Check Access Level Distribution
```sql
SELECT
    access_level,
    COUNT(*) as user_count
FROM users
GROUP BY access_level
ORDER BY user_count DESC;
```

### Check for Invalid Access Levels
```sql
SELECT id, first_name, last_name, email, access_level
FROM users
WHERE access_level NOT IN (
    'Super Admin', 'Admin', 'HR Admin', 'H&S Admin',
    'Dept. Manager', 'Manager', 'Trainer', 'User'
)
OR access_level IS NULL;
```

### Test Toolbar Display
1. Log in as different user types
2. Verify correct toolbar appears:
   - Super Admin → SuperAdminToolbar
   - Admin → AdminToolbar
   - HR Admin → HRAdminToolbar
   - H&S Admin → HSAdminToolbar
   - Dept. Manager / Manager → ManagerToolbar
   - Trainer → TrainerToolbar
   - User → UserToolbar

## Troubleshooting

### Issue: "Migration script won't run"
**Solution:** Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Issue: "Users have unrecognized access levels"
**Solution:** Either:
1. Add mapping to the script for your custom values
2. Manually update those users in Supabase dashboard

### Issue: "Toolbar not showing correct role"
**Check:**
1. User's `access_level` matches exactly (case-sensitive)
2. Browser cache cleared
3. User logged out and back in
4. Check browser console for errors

### Issue: "TypeError: Cannot read property 'toLowerCase'"
**Solution:** Some users have `null` access_level. Run:
```sql
UPDATE users SET access_level = 'User' WHERE access_level IS NULL;
```

## Rollback

If you need to rollback the migration:

### Using SQL Backup (if you ran SQL script)
```sql
-- Restore from backup table
UPDATE users
SET access_level = (
    SELECT access_level
    FROM users_access_level_backup
    WHERE users_access_level_backup.id = users.id
);

-- Drop the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_access_level_check;
```

### Manual Rollback
Simply update the users back to their old values via Supabase dashboard or SQL.

## Additional Configuration

### Add Shift Column (Optional)

If you want to track which shift a Manager oversees:

```sql
-- Add shift column
ALTER TABLE users ADD COLUMN shift VARCHAR(50);

-- Example values: 'Day Shift', 'Night Shift', 'Swing Shift'
UPDATE users SET shift = 'Day Shift' WHERE access_level = 'Manager' AND id = '[user-id]';
```

### Add Trainer Department Assignments (Optional)

To allow trainers to access multiple departments:

```sql
-- Create trainer_departments junction table
CREATE TABLE trainer_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(trainer_id, department_id)
);

-- Assign departments to a trainer
INSERT INTO trainer_departments (trainer_id, department_id)
VALUES
  ('[trainer-user-id]', '[department-1-id]'),
  ('[trainer-user-id]', '[department-2-id]');
```

## Support

If you encounter issues:
1. Check the console logs in browser dev tools
2. Check server logs: `npm run dev`
3. Verify database connection in `.env.local`
4. Ensure all files are saved and server restarted

## Next Steps

After successful migration:
1. ✅ Test each user role logs in correctly
2. ✅ Verify toolbars display appropriate sections
3. ✅ Check permission system works (users can't access unauthorized areas)
4. ✅ Update any user documentation
5. ✅ Train administrators on new access level system
