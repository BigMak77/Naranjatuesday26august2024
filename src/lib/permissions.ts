// lib/permissions.ts
export type AccessLevel =
  | "Super Admin"
  | "Admin"
  | "HR Admin"
  | "Manager"
  | "Dept. Manager"
  | "H&S Admin"
  | "Trainer"
  | "User";

export const PERMISSIONS = {
  // Super Admin permissions - absolute highest level
  "SUPER ADMIN": {
    canAccessAdmin: true,
    canAccessManager: true,
    canAccessHR: true,
    canAccessHS: true,
    canAccessTrainer: true,
    canAccessUser: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllReports: true,
    canManageSystem: true,
    canViewAllDepartments: true,
    canViewAllShifts: true,
    canManageTraining: true,
  },

  // Admin permissions - high level
  ADMIN: {
    canAccessAdmin: true,
    canAccessManager: true,
    canAccessHR: true,
    canAccessHS: true,
    canAccessTrainer: true,
    canAccessUser: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllReports: true,
    canManageSystem: true,
    canViewAllDepartments: true,
    canViewAllShifts: true,
    canManageTraining: true,
  },

  // HR Admin permissions
  "HR ADMIN": {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: true,
    canAccessHS: false,
    canAccessTrainer: false,
    canAccessUser: true,
    canManageUsers: true,
    canManageRoles: true,
    canViewAllReports: true,
    canManageSystem: false,
    canViewAllDepartments: true,
    canViewAllShifts: true,
    canManageTraining: false,
  },

  // H&S Admin permissions
  "H&S ADMIN": {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: false,
    canAccessHS: true,
    canAccessTrainer: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: true,
    canManageSystem: false,
    canViewAllDepartments: true,
    canViewAllShifts: true,
    canManageTraining: false,
  },

  // Dept. Manager permissions (department-wide manager)
  "DEPT. MANAGER": {
    canAccessAdmin: false,
    canAccessManager: true,
    canAccessHR: false,
    canAccessHS: false,
    canAccessTrainer: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
    canViewAllDepartments: false, // Only their department
    canViewAllShifts: true, // All shifts in their department
    canManageTraining: false,
  },

  // Manager permissions (shift-level manager)
  MANAGER: {
    canAccessAdmin: false,
    canAccessManager: true,
    canAccessHR: false,
    canAccessHS: false,
    canAccessTrainer: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
    canViewAllDepartments: false, // Only their department
    canViewAllShifts: false, // Only their shift
    canManageTraining: false,
  },

  // Trainer permissions (can have multi-department access)
  TRAINER: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: false,
    canAccessHS: false,
    canAccessTrainer: true,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
    canViewAllDepartments: false, // Assigned departments only
    canViewAllShifts: false,
    canManageTraining: true,
  },

  // User permissions - basic level
  USER: {
    canAccessAdmin: false,
    canAccessManager: false,
    canAccessHR: false,
    canAccessHS: false,
    canAccessTrainer: false,
    canAccessUser: true,
    canManageUsers: false,
    canManageRoles: false,
    canViewAllReports: false,
    canManageSystem: false,
    canViewAllDepartments: false,
    canViewAllShifts: false,
    canManageTraining: false,
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
 * Super Admin has access to ALL routes by default
 */
export function canAccessRoute(
  userAccessLevel: string | undefined,
  requiredLevels: AccessLevel[]
): boolean {
  if (!userAccessLevel) return false;

  const normalizedUserLevel = userAccessLevel.toLowerCase();

  // Super Admin has access to EVERYTHING
  if (normalizedUserLevel === "super admin") return true;

  const normalizedRequired = requiredLevels.map(level => level.toLowerCase());

  return normalizedRequired.includes(normalizedUserLevel);
}

/**
 * Get the appropriate dashboard URL for a user
 * Always redirects to location selector after login
 */
export function getDashboardUrl(userAccessLevel: string | undefined, userLocation?: string | null): string {
  if (!userAccessLevel) return "/login";

  // All authenticated users go to location selector after login
  return "/location-selector";
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
      path: "/manager",
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

  if (permissions.canAccessHS) {
    routes.push({
      path: "/health-safety",
      name: "Health & Safety",
      level: "H&S Admin"
    });
  }

  if (permissions.canAccessTrainer) {
    routes.push({
      path: "/trainer/dashboard",
      name: "Trainer Dashboard",
      level: "Trainer"
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

/**
 * Check if user is a department-level manager (can see all shifts in their department)
 */
export function isDeptManager(userAccessLevel: string | undefined): boolean {
  return userAccessLevel?.toLowerCase() === "dept. manager";
}

/**
 * Check if user is a shift-level manager (can only see their specific shift)
 */
export function isShiftManager(userAccessLevel: string | undefined): boolean {
  return userAccessLevel?.toLowerCase() === "manager";
}

/**
 * Check if user can view all departments
 */
export function canViewAllDepartments(userAccessLevel: string | undefined): boolean {
  return hasPermission(userAccessLevel, "canViewAllDepartments");
}

/**
 * Check if user can view all shifts (within their department scope)
 */
export function canViewAllShifts(userAccessLevel: string | undefined): boolean {
  return hasPermission(userAccessLevel, "canViewAllShifts");
}
