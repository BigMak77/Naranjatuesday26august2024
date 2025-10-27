# Access Control Wrapper Migration Guide

## Overview

This guide documents the unification of access control wrappers in the Naranja application. We've consolidated three different access control components into a single, more robust solution.

## Problem Statement

Previously, the application had **multiple overlapping access control systems** that caused inconsistencies and potential security issues:

1. **`PermissionWrapper`** - Used `usePermissions` hook for permission-based checks
2. **`RequireAccess`** - Used `useUser` directly for role-based routing
3. **`ManagerAccessGuard`** - Hardcoded manager access checks
4. **`DynamicToolbar`** - User-based toolbar switching without consistent access control

### Issues Identified

- **Inconsistent access control logic** across components
- **Multiple permission checking approaches** leading to conflicts
- **Potential race conditions** with different loading states
- **Duplicated functionality** between wrapper components
- **No unified access control strategy**

## Solution: AccessControlWrapper

We've created a unified `AccessControlWrapper` component that consolidates all access control patterns into a single, flexible interface.

### Key Features

- **Role-based access control** - Check user roles
- **Permission-based access control** - Check specific permissions
- **Custom access functions** - Define custom access logic
- **Flexible fallback behavior** - Hide, show message, or redirect
- **Consistent loading states** - Unified loading UX
- **Better error handling** - Clear access denied messages

### API Reference

```tsx
interface AccessControlWrapperProps {
  children: ReactNode;
  
  // Role-based access
  requiredRoles?: AccessLevel | AccessLevel[];
  
  // Permission-based access
  requiredPermission?: keyof typeof PERMISSIONS.ADMIN;
  
  // Behavior options
  fallback?: ReactNode;
  hideIfNoAccess?: boolean;
  redirectOnNoAccess?: boolean;
  redirectTo?: string;
  
  // Custom access check function
  customAccessCheck?: (user: any) => boolean;
  
  // Loading state
  loadingComponent?: ReactNode;
  
  // Error messages
  noAccessMessage?: string;
}
```

## Migration Examples

### Before (RequireAccess)
```tsx
<RequireAccess allowedRoles={["Manager", "Admin"]}>
  <ManagerPageWrapper />
</RequireAccess>
```

### After (AccessControlWrapper)
```tsx
<AccessControlWrapper 
  requiredRoles={["Manager", "Admin"]}
  redirectOnNoAccess={true}
  noAccessMessage="Manager access required. Redirecting to your dashboard..."
>
  <ManagerPageWrapper />
</AccessControlWrapper>
```

### Before (PermissionWrapper)
```tsx
<PermissionWrapper requiredRoles={["Manager", "Admin"]}>
  <SomeComponent />
</PermissionWrapper>
```

### After (AccessControlWrapper)
```tsx
<AccessControlWrapper 
  requiredRoles={["Manager", "Admin"]} 
  hideIfNoAccess={true}
>
  <SomeComponent />
</AccessControlWrapper>
```

## Files Updated

### ✅ Migrated Components
- `/src/app/manager/page.tsx` - Updated to use AccessControlWrapper
- `/src/app/admin/dashboard/page.tsx` - Updated to use AccessControlWrapper  
- `/src/app/hr/dashboard/page.tsx` - Updated to use AccessControlWrapper
- `/src/components/manager/DepartmentIssueAssignmentsWidget.tsx` - Updated to use AccessControlWrapper
- `/src/components/manager/ManagerPageWrapper.tsx` - Added access control for User Dashboard view

### 📦 New Components
- `/src/components/AccessControlWrapper.tsx` - Unified access control solution

### 🗑️ Deprecated Components (To Be Removed)
- `/src/components/PermissionWrapper.tsx` - Replace with AccessControlWrapper
- `/src/components/RequireAccess.tsx` - Replace with AccessControlWrapper  
- `/src/components/manager/ManagerAccessGuard.tsx` - Replace with AccessControlWrapper

## Migration Checklist

### For Developers

- [ ] Replace all `PermissionWrapper` usage with `AccessControlWrapper`
- [ ] Replace all `RequireAccess` usage with `AccessControlWrapper`
- [ ] Replace all `ManagerAccessGuard` usage with `AccessControlWrapper`
- [ ] Test access control on all protected pages
- [ ] Verify redirect behavior works correctly
- [ ] Ensure loading states are consistent

### Testing

- [ ] Test admin dashboard access (Admin only)
- [ ] Test HR dashboard access (HR and Admin)
- [ ] Test manager dashboard access (Manager and Admin)
- [ ] Test User Dashboard access within manager view
- [ ] Test redirect behavior for unauthorized users
- [ ] Test loading states during authentication

## Benefits

1. **Consistent Access Control** - Single source of truth for access logic
2. **Better Security** - Unified permission checking reduces bypass risks
3. **Improved UX** - Consistent loading and error states
4. **Maintainability** - Single component to maintain and update
5. **Flexibility** - Supports multiple access control patterns
6. **Performance** - Reduced duplicate permission checks

## Next Steps

1. **Complete Migration** - Find and update any remaining usage of old wrappers
2. **Remove Deprecated Files** - Delete old wrapper components after migration
3. **Add Tests** - Write unit tests for AccessControlWrapper
4. **Documentation** - Update component documentation
5. **Training** - Train team on new access control patterns

## Support

If you encounter issues during migration:

1. Check this guide for common patterns
2. Review the AccessControlWrapper API
3. Test thoroughly before deploying
4. Ask for help if needed

---

**Status**: ✅ Initial migration complete  
**Last Updated**: October 27, 2025  
**Version**: 1.0
