# Toolbar Permissions Update

## Overview
Updated toolbars and access controls to show relevant buttons for First Aiders and Safety Representatives based on their granular permissions.

## Changes Made

### 1. HealthSafetyToolbar
**File**: [src/components/healthsafety/HealthSafetyToolbar.tsx](src/components/healthsafety/HealthSafetyToolbar.tsx)

**Changes**:
- Added permission check using `usePermissions()` hook
- "Add First Aid Designation" button now only shows for users with:
  - `canAddFirstAidReport` permission (First Aiders)
  - H&S Admin role
  - Super Admin role
  - Admin role

**Code**:
```typescript
const { canAddFirstAidReport, isHSAdmin, isSuperAdmin, isAdmin } = usePermissions();
const canManageFirstAiders = canAddFirstAidReport || isHSAdmin || isSuperAdmin || isAdmin;

{canManageFirstAiders && (
  <NeonIconButton
    variant="add"
    icon={<FiPlus />}
    title="Add First Aid Designation"
    onClick={() => setShowAddFirstAidWidget(!showAddFirstAidWidget)}
  />
)}
```

### 2. UserToolbar
**File**: [src/components/ui/UserToolbar.tsx](src/components/ui/UserToolbar.tsx)

**Changes**:
- Added two new permission-based buttons for regular users:
  1. **Add First Aid Report** button (heart icon)
     - Shows only for users with `canAddFirstAidReport` permission
     - Links to `/health-safety/firstaid`

  2. **Add Risk Assessment** button (shield icon)
     - Shows only for users with `canAddRiskAssessment` permission
     - Links to `/health-safety`

**Code**:
```typescript
const { isFirstAider, isSafetyRep, canAddFirstAidReport, canAddRiskAssessment } = usePermissions();

{/* First Aider Button */}
{canAddFirstAidReport && (
  <NeonIconButton
    icon={<FiHeart />}
    variant="add"
    title="Add First Aid Report"
    onClick={() => (window.location.href = "/health-safety/firstaid")}
  />
)}

{/* Safety Rep Button */}
{canAddRiskAssessment && (
  <NeonIconButton
    icon={<FiShield />}
    variant="add"
    title="Add Risk Assessment"
    onClick={() => (window.location.href = "/health-safety")}
  />
)}
```

### 3. Health & Safety Page Access Control
**File**: [src/app/health-safety/page.tsx](src/app/health-safety/page.tsx)

**Changes**:
- Updated `AccessControlWrapper` to allow Safety Reps and First Aiders
- Added `customAccessCheck` function that checks for:
  - Risk assessment permissions (`canAddRiskAssessment`)
  - First aid permissions (`canAddFirstAidReport`)
  - Admin roles (H&S Admin, Super Admin, Admin)

**Code**:
```typescript
<AccessControlWrapper
  requiredRoles={["Super Admin", "Admin", "H&S Admin"]}
  customAccessCheck={(user) => {
    return canAddRiskAssessment || canAddFirstAidReport || isHSAdmin || isSuperAdmin || isAdmin;
  }}
  redirectOnNoAccess={true}
  noAccessMessage="Health & Safety access required. Redirecting to your dashboard..."
>
```

## User Experience Flow

### For First Aiders
1. **Permission Assignment**:
   - Admin goes to `/admin/permissions`
   - Assigns "First Aider" permission to user

2. **User Toolbar**:
   - User sees a new **heart icon** button in their toolbar
   - Button labeled "Add First Aid Report"
   - Clicking navigates to `/health-safety/firstaid`

3. **Health & Safety Pages**:
   - User can now access health & safety pages
   - Can add and edit first aid reports
   - AddFirstAidWidget renders for them

### For Safety Representatives
1. **Permission Assignment**:
   - Admin goes to `/admin/permissions`
   - Assigns "Safety Representative" permission to user

2. **User Toolbar**:
   - User sees a new **shield icon** button in their toolbar
   - Button labeled "Add Risk Assessment"
   - Clicking navigates to `/health-safety`

3. **Health & Safety Pages**:
   - User can now access health & safety pages
   - Can add and edit risk assessments
   - "Create New" button shows in RiskAssessmentManager

### For Users with Both Permissions
- Users can have both First Aider and Safety Rep permissions
- They will see both buttons in their toolbar:
  - Heart icon for First Aid Reports
  - Shield icon for Risk Assessments

## Component Hierarchy

```
DynamicToolbar (decides which toolbar to show)
├── SuperAdminToolbar (Super Admins)
├── AdminToolbar (Admins)
├── HRAdminToolbar (HR Admins)
├── HSAdminToolbar (H&S Admins)
├── ManagerToolbar (Dept. Managers & Managers)
├── TrainerToolbar (Trainers)
└── UserToolbar (Regular Users) ⭐ UPDATED
    ├── First Aid Report Button (if canAddFirstAidReport)
    ├── Risk Assessment Button (if canAddRiskAssessment)
    └── Contact Admin Button
```

## Permission Flow Chart

```
User with Regular "User" Access Level
│
├─ Assigned "First Aider" Permission
│  ├─ Sees heart icon in UserToolbar
│  ├─ Can access /health-safety/firstaid
│  ├─ Can add first aid reports
│  └─ Can edit first aid reports
│
├─ Assigned "Safety Rep" Permission
│  ├─ Sees shield icon in UserToolbar
│  ├─ Can access /health-safety
│  ├─ Can add risk assessments
│  ├─ Can edit risk assessments
│  └─ Sees "Create New" button in RiskAssessmentManager
│
└─ Has Both Permissions
   ├─ Sees both heart and shield icons
   └─ Has full access to both features
```

## Testing Checklist

### Test First Aider Permissions
- [ ] Assign First Aider permission to test user
- [ ] Log in as test user
- [ ] Verify heart icon appears in UserToolbar
- [ ] Click heart icon, verify navigates to `/health-safety/firstaid`
- [ ] Verify user can add first aid reports
- [ ] Verify "Add First Aid Designation" button shows in HealthSafetyToolbar

### Test Safety Rep Permissions
- [ ] Assign Safety Rep permission to test user
- [ ] Log in as test user
- [ ] Verify shield icon appears in UserToolbar
- [ ] Click shield icon, verify navigates to `/health-safety`
- [ ] Verify user can access risk assessment page
- [ ] Verify "Create New" button shows in RiskAssessmentManager
- [ ] Verify user can add risk assessments

### Test Permission Removal
- [ ] Remove First Aider permission from user
- [ ] Verify heart icon disappears from toolbar
- [ ] Verify user cannot access first aid features
- [ ] Remove Safety Rep permission
- [ ] Verify shield icon disappears from toolbar
- [ ] Verify user cannot access risk assessment features

### Test Admin Override
- [ ] Verify H&S Admins see all buttons regardless of permissions
- [ ] Verify Super Admins see all buttons regardless of permissions
- [ ] Verify Admins see all buttons regardless of permissions

## Files Modified

1. [src/components/healthsafety/HealthSafetyToolbar.tsx](src/components/healthsafety/HealthSafetyToolbar.tsx)
2. [src/components/ui/UserToolbar.tsx](src/components/ui/UserToolbar.tsx)
3. [src/app/health-safety/page.tsx](src/app/health-safety/page.tsx)

## Related Documentation

- [PERMISSIONS_IMPLEMENTATION_SUMMARY.md](PERMISSIONS_IMPLEMENTATION_SUMMARY.md) - Complete permissions system documentation
- [src/lib/usePermissions.ts](src/lib/usePermissions.ts) - Permissions hook with helper functions

## Notes

- **UserToolbar** is the toolbar shown to regular "User" access level users
- **DynamicToolbar** automatically selects the correct toolbar based on user's access level
- Permission checks use the `usePermissions()` hook for consistency
- Icons used:
  - `FiHeart` (heart) for First Aid
  - `FiShield` (shield) for Safety/Risk Assessments
- All permission checks respect the hierarchy: Super Admin > Admin > H&S Admin > Specific Permissions
