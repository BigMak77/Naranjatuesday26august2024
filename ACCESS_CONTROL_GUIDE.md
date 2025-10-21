# Access Control System Documentation

## Overview

This application implements a comprehensive role-based access control (RBAC) system with the following components:

## User Roles

- **Admin**: Full system access, can manage everything
- **HR**: Human resources access, can manage users and view reports  
- **Manager**: Department management access, can manage team and assignments
- **User**: Basic employee access to their own data and tasks

## Access Control Components

### 1. `RequireAccess` Component

**Purpose**: Page-level protection that wraps entire pages or sections.

**Usage**:
```tsx
import RequireAccess from "@/components/RequireAccess";

export default function ManagerPage() {
  return (
    <RequireAccess allowedRoles={["Manager", "Admin"]}>
      <h1>Manager Dashboard</h1>
      {/* Page content */}
    </RequireAccess>
  );
}
```

**Props**:
- `allowedRoles`: Single role or array of roles that can access this content
- `fallbackMessage`: Custom message when access is denied (optional)
- `redirectTo`: Custom redirect URL (optional)

### 2. `PermissionWrapper` Component  

**Purpose**: Component-level protection for granular access control within pages.

**Usage**:
```tsx
import PermissionWrapper from "@/components/PermissionWrapper";

function MyComponent() {
  return (
    <div>
      <h1>Public Content</h1>
      
      <PermissionWrapper requiredRoles={["Admin", "HR"]}>
        <AdminOnlyButton />
      </PermissionWrapper>
      
      <PermissionWrapper requiredPermission="canManageUsers">
        <UserManagementPanel />
      </PermissionWrapper>
    </div>
  );
}
```

**Props**:
- `requiredRoles`: Roles that can see this content
- `requiredPermission`: Specific permission check
- `fallback`: Content to show when access is denied
- `hideIfNoAccess`: Whether to hide completely (default: true)

### 3. `ProtectedNavLink` Component

**Purpose**: Navigation links that only appear if user has access.

**Usage**:
```tsx
import ProtectedNavLink from "@/components/ProtectedNavLink";

function Navigation() {
  return (
    <nav>
      <ProtectedNavLink href="/admin/dashboard" requiredRoles={["Admin"]}>
        Admin Dashboard
      </ProtectedNavLink>
      
      <ProtectedNavLink href="/hr/people" requiredPermission="canManageUsers">
        Manage People  
      </ProtectedNavLink>
    </nav>
  );
}
```

### 4. `usePermissions` Hook

**Purpose**: Hook for checking permissions in components.

**Usage**:
```tsx
import { usePermissions } from "@/lib/usePermissions";

function MyComponent() {
  const { 
    isAdmin, 
    isManager, 
    canManageUsers, 
    checkPermission 
  } = usePermissions();

  return (
    <div>
      {isAdmin() && <AdminPanel />}
      {canManageUsers && <UsersList />}
      {checkPermission("canViewAllReports") && <ReportsLink />}
    </div>
  );
}
```

**Available Methods**:
- `isAdmin()`, `isHR()`, `isManager()`, `isUser()`: Role checks
- `canManageUsers`, `canManageRoles`, `canViewAllReports`, etc.: Permission flags
- `checkPermission(permission)`: Check specific permission
- `checkRouteAccess(roles)`: Check if user can access specific roles

## Permissions System

The permissions are defined in `/src/lib/permissions.ts`:

```typescript
export const PERMISSIONS = {
  ADMIN: {
    canAccessAdmin: true,
    canAccessManager: true, 
    canAccessHR: true,
    canAccessUser: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllReports: true,
    canManageSystem: true,
  },
  // ... other roles
}
```

## Implementation Examples

### Protecting Pages

1. **Admin Dashboard** (`/admin/dashboard/page.tsx`):
```tsx
export default function AdminDashboard() {
  return (
    <RequireAccess allowedRoles={["Admin"]}>
      <AdminContent />
    </RequireAccess>
  );
}
```

2. **HR Dashboard** (`/hr/dashboard/page.tsx`):
```tsx
export default function HRDashboard() {
  return (
    <RequireAccess allowedRoles={["HR", "Admin"]}>
      <HRContent />
    </RequireAccess>
  );
}
```

3. **Manager Dashboard** (`/manager/page.tsx`):
```tsx
export default function ManagerDashboard() {
  return (
    <RequireAccess allowedRoles={["Manager", "Admin"]}>
      <ManagerContent />
    </RequireAccess>
  );
}
```

### Protecting Components

1. **Manager-only Widget**:
```tsx
export default function DepartmentWidget() {
  return (
    <PermissionWrapper requiredRoles={["Manager", "Admin"]}>
      <h2>Department Issues</h2>
      <IssuesList />
    </PermissionWrapper>
  );
}
```

2. **Admin Settings**:
```tsx
function SettingsPanel() {
  return (
    <div>
      <h2>Settings</h2>
      
      <PermissionWrapper requiredPermission="canManageSystem">
        <SystemSettings />
      </PermissionWrapper>
      
      <PermissionWrapper requiredPermission="canManageUsers">
        <UserSettings />
      </PermissionWrapper>
    </div>
  );
}
```

### Navigation Protection

```tsx
function MainNavigation() {
  return (
    <nav>
      <ProtectedNavLink href="/user/dashboard" requiredRoles={["User", "Manager", "Admin", "HR"]}>
        My Dashboard
      </ProtectedNavLink>
      
      <ProtectedNavLink href="/manager/dashboard" requiredRoles={["Manager", "Admin"]}>
        Manager Dashboard
      </ProtectedNavLink>
      
      <ProtectedNavLink href="/hr/dashboard" requiredRoles={["HR", "Admin"]}>
        HR Dashboard
      </ProtectedNavLink>
      
      <ProtectedNavLink href="/admin/dashboard" requiredRoles={["Admin"]}>
        Admin Dashboard
      </ProtectedNavLink>
    </nav>
  );
}
```

## Security Notes

1. **Defense in Depth**: The system uses multiple layers:
   - Component-level protection (`RequireAccess`, `PermissionWrapper`)
   - Hook-based checks (`usePermissions`)
   - Server-side API protection (implement in API routes)

2. **Client-side Only**: The current implementation is client-side only. For sensitive data, always validate permissions on the server side in API routes.

3. **Database Security**: Ensure your Supabase Row Level Security (RLS) policies align with these permissions.

## Adding New Roles/Permissions

1. **Add to permissions.ts**:
```typescript
export const PERMISSIONS = {
  // ... existing roles
  SUPERVISOR: {
    canAccessUser: true,
    canAccessManager: true,
    // ... define permissions
  }
}
```

2. **Update type definitions**:
```typescript
export type AccessLevel = "Admin" | "Manager" | "User" | "HR" | "Supervisor";
```

3. **Use in components**:
```tsx
<RequireAccess allowedRoles={["Supervisor", "Manager", "Admin"]}>
  <SupervisorContent />
</RequireAccess>
```

## Testing Access Control

Test your access control by:
1. Creating test users with different roles
2. Logging in as each role
3. Verifying only appropriate content is visible
4. Checking that protected routes redirect properly
5. Ensuring API endpoints validate permissions server-side
