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

  // Check if user has a specific granular permission (from permissions array)
  const hasGranularPermission = (permissionKey: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permissionKey);
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
    hasGranularPermission,

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

    // Granular permission helpers for first aiders and safety reps
    canAddFirstAidReport: hasGranularPermission("health-safety:add-first-aid-report") ||
                          hasGranularPermission("health-safety:manage-first-aid") ||
                          isHSAdmin() ||
                          isSuperAdmin() ||
                          isAdmin(),
    canEditFirstAidReport: hasGranularPermission("health-safety:edit-first-aid-report") ||
                           hasGranularPermission("health-safety:manage-first-aid") ||
                           isHSAdmin() ||
                           isSuperAdmin() ||
                           isAdmin(),
    canAddRiskAssessment: hasGranularPermission("health-safety:add-risk-assessment") ||
                          hasGranularPermission("health-safety:manage-risk-assessments") ||
                          isHSAdmin() ||
                          isSuperAdmin() ||
                          isAdmin(),
    canEditRiskAssessment: hasGranularPermission("health-safety:edit-risk-assessment") ||
                           hasGranularPermission("health-safety:manage-risk-assessments") ||
                           isHSAdmin() ||
                           isSuperAdmin() ||
                           isAdmin(),
    canApproveRiskAssessment: hasGranularPermission("health-safety:approve-risk-assessment") ||
                              hasGranularPermission("health-safety:manage-risk-assessments") ||
                              isHSAdmin() ||
                              isSuperAdmin() ||
                              isAdmin(),
    isFirstAider: hasGranularPermission("health-safety:add-first-aid-report") ||
                  hasGranularPermission("health-safety:manage-first-aid"),
    isSafetyRep: hasGranularPermission("health-safety:add-risk-assessment") ||
                 hasGranularPermission("health-safety:manage-risk-assessments"),
  };
}
