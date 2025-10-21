// lib/permissions.ts
export type AccessLevel = "Admin" | "Manager" | "User" | "HR";

export const PERMISSIONS = {
  // Admin permissions - highest level
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
  
  // HR permissions
  HR: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: true,
    canAccessUser: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllReports: true,
    canManageSystem: false,
  },
  
  // Manager permissions
  MANAGER: {
    canAccessAdmin: false,
    canAccessManager: true,
    canAccessHR: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
  },
  
  // User permissions - basic level
  USER: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
  },
} as const;

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userAccessLevel: string | undefined,
  permission: keyof typeof PERMISSIONS.ADMIN
): boolean {
  if (!userAccessLevel) return false;
  
  const level = userAccessLevel.toUpperCase() as keyof typeof PERMISSIONS;
  const userPermissions = PERMISSIONS[level];
  
  if (!userPermissions) return false;
  
  return userPermissions[permission];
}

/**
 * Check if user can access a specific route/page
 */
export function canAccessRoute(
  userAccessLevel: string | undefined,
  requiredLevels: AccessLevel[]
): boolean {
  if (!userAccessLevel) return false;
  
  const normalizedUserLevel = userAccessLevel.toLowerCase();
  const normalizedRequired = requiredLevels.map(level => level.toLowerCase());
  
  return normalizedRequired.includes(normalizedUserLevel);
}

/**
 * Get the appropriate dashboard URL for a user
 */
export function getDashboardUrl(userAccessLevel: string | undefined): string {
  if (!userAccessLevel) return "/login";
  
  const level = userAccessLevel.toLowerCase();
  
  switch (level) {
    case "admin":
      return "/admin/dashboard";
    case "hr":
      return "/hr/dashboard";
    case "manager":
      return "/manager/dashboard";
    case "user":
    default:
      return "/user/dashboard";
  }
}

/**
 * Get available routes for a user based on their access level
 */
export function getAvailableRoutes(userAccessLevel: string | undefined) {
  if (!userAccessLevel) return [];
  
  const level = userAccessLevel.toUpperCase() as keyof typeof PERMISSIONS;
  const permissions = PERMISSIONS[level];
  
  if (!permissions) return [];
  
  const routes = [];
  
  if (permissions.canAccessUser) {
    routes.push({
      path: "/user/dashboard",
      name: "User Dashboard",
      level: "User"
    });
  }
  
  if (permissions.canAccessManager) {
    routes.push({
      path: "/manager/dashboard",
      name: "Manager Dashboard", 
      level: "Manager"
    });
  }
  
  if (permissions.canAccessHR) {
    routes.push({
      path: "/hr/dashboard",
      name: "HR Dashboard",
      level: "HR"
    });
  }
  
  if (permissions.canAccessAdmin) {
    routes.push({
      path: "/admin/dashboard", 
      name: "Admin Dashboard",
      level: "Admin"
    });
  }
  
  return routes;
}
