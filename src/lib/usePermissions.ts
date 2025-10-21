// lib/usePermissions.ts
"use client";

import { useUser } from "./useUser";
import { hasPermission, canAccessRoute, AccessLevel, PERMISSIONS } from "./permissions";

export function usePermissions() {
  const { user, loading } = useUser();

  const checkPermission = (permission: keyof typeof PERMISSIONS.ADMIN): boolean => {
    return hasPermission(user?.access_level, permission);
  };

  const checkRouteAccess = (requiredLevels: AccessLevel[]): boolean => {
    return canAccessRoute(user?.access_level, requiredLevels);
  };

  const isAdmin = () => user?.access_level?.toLowerCase() === "admin";
  const isHR = () => user?.access_level?.toLowerCase() === "hr";
  const isManager = () => user?.access_level?.toLowerCase() === "manager";
  const isUser = () => user?.access_level?.toLowerCase() === "user";

  return {
    user,
    loading,
    checkPermission,
    checkRouteAccess,
    isAdmin,
    isHR,
    isManager,
    isUser,
    canAccessAdmin: checkPermission("canAccessAdmin"),
    canAccessManager: checkPermission("canAccessManager"),
    canAccessHR: checkPermission("canAccessHR"),
    canAccessUser: checkPermission("canAccessUser"),
    canManageUsers: checkPermission("canManageUsers"),
    canManageRoles: checkPermission("canManageRoles"),
    canViewAllReports: checkPermission("canViewAllReports"),
    canManageSystem: checkPermission("canManageSystem"),
  };
}
