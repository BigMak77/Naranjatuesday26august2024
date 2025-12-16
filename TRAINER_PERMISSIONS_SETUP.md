# Trainer Permissions Feature - Setup Guide

## Overview
The Trainer column has been modified to only show an icon for users who are trainers. Clicking this icon opens a dialog where you can configure which departments and shifts that trainer can view when they log in.

## What Changed

### 1. Database Migration
**File**: `supabase/migrations/20251216_create_trainer_permissions.sql`

A new `trainer_permissions` table has been created with the following structure:
- `id` - UUID primary key
- `user_id` - References the user (trainer)
- `department_id` - Department the trainer can view (optional)
- `shift_id` - Shift the trainer can view (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

The table includes:
- Unique constraint on (user_id, department_id, shift_id)
- Indexes for better performance
- Row Level Security (RLS) policies
- Automatic updated_at timestamp trigger

### 2. New Component
**File**: `src/components/user/TrainerPermissionsDialog.tsx`

This dialog allows you to:
- Select which departments the trainer can view
- Select which shifts the trainer can view
- Save the permissions to the database
- Clear/modify existing permissions

### 3. Updated UserManagementPanel
**File**: `src/components/user/UserManagementPanel.tsx`

Changes:
- Import the new TrainerPermissionsDialog component
- Added state for trainer permissions dialog
- Modified the Trainer column to:
  - Only show an icon (FiUsers) when `is_trainer` is true
  - Show nothing when `is_trainer` is false
  - Make the icon clickable
  - Add hover effect for better UX
  - Open the permissions dialog on click

## Setup Instructions

### Step 1: Apply the Database Migration

You need to apply the migration to create the `trainer_permissions` table. Choose one of these methods:

#### Option A: Using Supabase Dashboard (RECOMMENDED)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20251216_create_trainer_permissions.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

#### Option B: Using Supabase CLI
```bash
cd "/Users/bigmak/Documents/Naranja 4.3 copy"
npx supabase db push
```
Note: This may have conflicts with existing migrations. If it does, use Option A.

### Step 2: Test the Feature

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the HR Admin view → People tab

3. Find a user who has `is_trainer` set to `true`

4. You should see a green users icon (FiUsers) in the Trainer column

5. Click the icon - the Trainer Permissions dialog should open

6. Select departments and shifts for the trainer

7. Click "Save Permissions"

## How It Works

### User Interface Flow
1. User opens the People management page
2. Only trainers (is_trainer = true) show an icon in the Trainer column
3. Clicking the icon opens the TrainerPermissionsDialog
4. Admin can select multiple departments and shifts
5. Selections are saved to the `trainer_permissions` table
6. These permissions can be queried when the trainer logs in to show only relevant data

### Database Queries

#### Get permissions for a trainer:
```sql
SELECT department_id, shift_id
FROM trainer_permissions
WHERE user_id = 'trainer-user-id';
```

#### Get all departments a trainer can view:
```sql
SELECT DISTINCT d.*
FROM departments d
JOIN trainer_permissions tp ON tp.department_id = d.id
WHERE tp.user_id = 'trainer-user-id';
```

#### Get all shifts a trainer can view:
```sql
SELECT DISTINCT s.*
FROM shift_patterns s
JOIN trainer_permissions tp ON tp.shift_id = s.id
WHERE tp.user_id = 'trainer-user-id';
```

## Next Steps

After setting up this feature, you may want to:

1. **Update Trainer Views**: Modify trainer-facing pages to filter data based on their permissions:
   - Filter user lists by allowed departments
   - Filter training records by allowed shifts
   - Show only relevant training modules

2. **Add Permission Checking**: Create a helper function to check if a trainer has access:
   ```typescript
   async function hasTrainerAccess(userId: string, departmentId?: string, shiftId?: string) {
     const { data } = await supabase
       .from('trainer_permissions')
       .select('id')
       .eq('user_id', userId)
       .or(`department_id.eq.${departmentId},shift_id.eq.${shiftId}`)
       .limit(1);

     return data && data.length > 0;
   }
   ```

3. **Update Trainer Dashboard**: Use permissions to show only relevant data when trainers log in

## Security

The `trainer_permissions` table has Row Level Security (RLS) enabled with the following policies:

- **Read**: All authenticated users can read permissions
- **Insert/Update/Delete**: Only Super Admins, HR Admins, and Admins can modify permissions

This ensures that:
- Trainers can see what they have access to
- Only authorized personnel can grant or revoke trainer permissions

## Troubleshooting

### Icon not showing
- Verify the user has `is_trainer` set to `true` in the database
- Check browser console for any errors
- Ensure the component is properly imported

### Dialog not opening
- Check browser console for errors
- Verify the TrainerPermissionsDialog component is rendered
- Ensure the onClick handler is attached

### Cannot save permissions
- Verify the migration was applied successfully
- Check that you have the correct access level (HR Admin or above)
- Look at browser console and network tab for errors

### Database migration errors
- Use the Supabase SQL Editor (Option A) instead of CLI
- Check for existing table conflicts
- Verify you have database admin access

## Files Changed/Created

### New Files
- `supabase/migrations/20251216_create_trainer_permissions.sql` - Database migration
- `src/components/user/TrainerPermissionsDialog.tsx` - Permissions dialog component
- `scripts/apply-trainer-permissions-migration.mjs` - Migration helper script
- `TRAINER_PERMISSIONS_SETUP.md` - This documentation

### Modified Files
- `src/components/user/UserManagementPanel.tsx` - Updated Trainer column behavior

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the migration was applied correctly
3. Ensure all files are saved and the dev server is restarted
4. Check the Supabase logs for database errors
