// lib/usePermissions.ts
"use client";

import { useUser } from "./useUser";
import {
  hasPermission,
  canAccessRoute,
  isDeptManager,
  isShiftManager,
  canViewAllDepartments,
  canViewAllShifts,
  AccessLevel,
  PERMISSIONS
} from "./permissions";

export function usePermissions() {
  const { user, loading } = useUser();

  const checkPermission = (permission: keyof typeof PERMISSIONS.ADMIN): boolean => {
    return hasPermission(user?.access_level, permission);
  };

  const checkRouteAccess = (requiredLevels: AccessLevel[]): boolean => {
    return canAccessRoute(user?.access_level, requiredLevels);
  };

  // Role check helpers
  const isSuperAdmin = () => user?.access_level?.toLowerCase() === "super admin";
  const isAdmin = () => user?.access_level?.toLowerCase() === "admin";
  const isHRAdmin = () => user?.access_level?.toLowerCase() === "hr admin" || user?.access_level?.toLowerCase() === "hr";
  const isHSAdmin = () => user?.access_level?.toLowerCase() === "h&s admin";
  const isDeptMgr = () => isDeptManager(user?.access_level);
  const isShiftMgr = () => isShiftManager(user?.access_level);
  const isTrainer = () => user?.access_level?.toLowerCase() === "trainer";
  const isUser = () => user?.access_level?.toLowerCase() === "user";

  // Manager type checker (either dept or shift manager)
  const isAnyManager = () => isDeptMgr() || isShiftMgr();

  // Legacy compatibility
  const isHR = isHRAdmin;
  const isManager = isAnyManager;

  return {
    user,
    loading,
    checkPermission,
    checkRouteAccess,

    // Role checks
    isSuperAdmin,
    isAdmin,
    isHRAdmin,
    isHR, // Legacy
    isHSAdmin,
    isDeptManager: isDeptMgr,
    isShiftManager: isShiftMgr,
    isAnyManager,
    isManager, // Legacy
    isTrainer,
    isUser,

    // Permission checks
    canAccessAdmin: checkPermission("canAccessAdmin"),
    canAccessManager: checkPermission("canAccessManager"),
    canAccessHR: checkPermission("canAccessHR"),
    canAccessHS: checkPermission("canAccessHS"),
    canAccessTrainer: checkPermission("canAccessTrainer"),
    canAccessUser: checkPermission("canAccessUser"),
    canManageUsers: checkPermission("canManageUsers"),
    canManageRoles: checkPermission("canManageRoles"),
    canViewAllReports: checkPermission("canViewAllReports"),
    canManageSystem: checkPermission("canManageSystem"),
    canViewAllDepartments: canViewAllDepartments(user?.access_level),
    canViewAllShifts: canViewAllShifts(user?.access_level),
    canManageTraining: checkPermission("canManageTraining"),
  };
}
