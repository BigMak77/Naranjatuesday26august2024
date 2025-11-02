# Permissions System Implementation Summary

## Overview
We've implemented a granular permissions system that allows you to assign specific permissions to users, enabling First Aiders and Safety Representatives to perform their designated tasks.

## What Was Implemented

### 1. New Permissions Added
The following permissions have been added to the database:

#### First Aider Permissions
- `health-safety:add-first-aid-report` - Add first aid reports and incidents
- `health-safety:edit-first-aid-report` - Edit first aid reports
- `health-safety:manage-first-aid` - Full first aid management capabilities

#### Safety Representative Permissions
- `health-safety:add-risk-assessment` - Create new risk assessments
- `health-safety:edit-risk-assessment` - Edit and update risk assessments
- `health-safety:manage-risk-assessments` - Full risk assessment management
- `health-safety:approve-risk-assessment` - Approve or reject risk assessments

### 2. Database Changes
- **Migration File**: [supabase/migrations/20251101_add_firstaider_safety_permissions.sql](supabase/migrations/20251101_add_firstaider_safety_permissions.sql)
- **Migration Script**: [run-permissions-migration.js](run-permissions-migration.js) - Successfully executed ✅
- **Users Table**: Already has a `permissions` column (TEXT[]) to store permission keys

### 3. Code Updates

#### Type Definitions
- **File**: [src/types/userPermissions.ts](src/types/userPermissions.ts)
- Added new permission keys to the PERMISSIONS constant
- These are used for type checking and autocomplete

#### User Context
- **Files Updated**:
  - [src/context/UserContext.tsx](src/context/UserContext.tsx)
  - [src/lib/useUser.ts](src/lib/useUser.ts)
- Added `permissions?: string[]` field to the user type
- Updated database queries to include permissions in user data

#### Permissions Hook
- **File**: [src/lib/usePermissions.ts](src/lib/usePermissions.ts)
- Added `hasGranularPermission()` function to check specific permissions
- Added convenience helper functions:
  - `canAddFirstAidReport` - Checks if user can add first aid reports
  - `canEditFirstAidReport` - Checks if user can edit first aid reports
  - `canAddRiskAssessment` - Checks if user can add risk assessments
  - `canEditRiskAssessment` - Checks if user can edit risk assessments
  - `canApproveRiskAssessment` - Checks if user can approve risk assessments
  - `isFirstAider` - Helper to check if user has first aider permissions
  - `isSafetyRep` - Helper to check if user has safety rep permissions

### 4. UI Components

#### Quick Permission Assignment Component
- **File**: [src/components/user/QuickPermissionAssign.tsx](src/components/user/QuickPermissionAssign.tsx)
- Simplified interface for assigning First Aider and Safety Rep permissions
- Features:
  - User selection dropdown
  - Visual checkboxes for First Aider and Safety Rep roles
  - Real-time permission updates
  - Success/error feedback

#### Permissions Management Page
- **File**: [src/app/admin/permissions/page.tsx](src/app/admin/permissions/page.tsx)
- Admin interface for managing user permissions
- Features:
  - Quick Assignment tab for First Aider and Safety Rep roles
  - Advanced Permissions tab for all granular permissions
  - Documentation explaining each role

### 5. Permission Checks Applied

#### Risk Assessment Manager
- **File**: [src/components/healthsafety/RiskAssessmentManager.tsx](src/components/healthsafety/RiskAssessmentManager.tsx)
- "Create New" button only shows for users with `canAddRiskAssessment` permission
- Uses `canEditRiskAssessment` for edit operations
- Respects Safety Rep permissions

#### First Aid Widget
- **File**: [src/components/healthsafety/AddFirstAidWidget.tsx](src/components/healthsafety/AddFirstAidWidget.tsx)
- Component only renders for users with `canAddFirstAidReport` permission
- Prevents unauthorized users from adding first aiders

## How to Use the System

### For Administrators

1. **Navigate to Permissions Page**
   - Go to `/admin/permissions`
   - You'll see two tabs: "Quick Assignment" and "Advanced Permissions"

2. **Assign First Aider Permission**
   - Select "Quick Assignment" tab
   - Choose a user from the dropdown
   - Check the "First Aider" checkbox
   - Click "Save Permissions"

3. **Assign Safety Representative Permission**
   - Select "Quick Assignment" tab
   - Choose a user from the dropdown
   - Check the "Safety Representative" checkbox
   - Click "Save Permissions"

4. **Advanced Permissions**
   - Select "Advanced Permissions" tab
   - Choose a user
   - Toggle individual permissions as needed
   - Click "Save Permissions"

### For Developers

#### Check if User is a First Aider
```typescript
import { usePermissions } from "@/lib/usePermissions";

function MyComponent() {
  const { isFirstAider, canAddFirstAidReport } = usePermissions();

  if (isFirstAider) {
    // User has first aider permissions
  }

  if (canAddFirstAidReport) {
    // Show add first aid report button
  }
}
```

#### Check if User is a Safety Rep
```typescript
import { usePermissions } from "@/lib/usePermissions";

function MyComponent() {
  const { isSafetyRep, canAddRiskAssessment } = usePermissions();

  if (isSafetyRep) {
    // User has safety rep permissions
  }

  if (canAddRiskAssessment) {
    // Show add risk assessment button
  }
}
```

#### Check Granular Permission
```typescript
import { usePermissions } from "@/lib/usePermissions";

function MyComponent() {
  const { hasGranularPermission } = usePermissions();

  if (hasGranularPermission("health-safety:approve-risk-assessment")) {
    // Show approve button
  }
}
```

## Permission Hierarchy

The system follows this hierarchy:
1. **Super Admin** - Has ALL permissions automatically
2. **Admin** - Has ALL permissions automatically
3. **H&S Admin** - Has all health & safety permissions automatically
4. **Specific Permissions** - Users with granular permissions assigned

This means:
- Super Admins and Admins don't need First Aider or Safety Rep permissions assigned
- H&S Admins automatically have access to all health & safety functions
- Regular users need specific permissions assigned to perform these tasks

## Database Schema

### Permissions Table
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  key TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Users Table (permissions column)
```sql
ALTER TABLE users ADD COLUMN permissions TEXT[] DEFAULT '{}';
CREATE INDEX idx_users_permissions ON users USING GIN(permissions);
```

## Files Created/Modified

### New Files
1. `supabase/migrations/20251101_add_firstaider_safety_permissions.sql`
2. `run-permissions-migration.js`
3. `src/components/user/QuickPermissionAssign.tsx`
4. `src/app/admin/permissions/page.tsx`
5. `PERMISSIONS_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified Files
1. `src/types/userPermissions.ts` - Added new permission keys
2. `src/context/UserContext.tsx` - Added permissions field
3. `src/lib/useUser.ts` - Added permissions field and query
4. `src/lib/usePermissions.ts` - Added permission check helpers
5. `src/components/healthsafety/RiskAssessmentManager.tsx` - Applied permission checks
6. `src/components/healthsafety/AddFirstAidWidget.tsx` - Applied permission checks

## Next Steps

1. **Test the System**
   - Navigate to `/admin/permissions`
   - Assign permissions to test users
   - Verify that buttons appear/disappear based on permissions

2. **Apply to Additional Components**
   - You can apply the same pattern to other health & safety components
   - Use `canAddFirstAidReport` and `canEditFirstAidReport` in first aid report forms
   - Use `canApproveRiskAssessment` for approval workflows

3. **Extend as Needed**
   - Add more granular permissions following the same pattern
   - Update the migration script to add new permissions
   - Add new helper functions to usePermissions hook

## Troubleshooting

### Permission not working?
- Check that the user has the permission in the database
- Verify the user's session is refreshed (may need to log out/in)
- Check browser console for any errors

### Migration already ran?
- The migration uses `upsert` so it's safe to run multiple times
- Existing permissions won't be duplicated

### Need to remove permissions?
- Use the Advanced Permissions tab in `/admin/permissions`
- Uncheck the permissions you want to remove
- Click Save Permissions
