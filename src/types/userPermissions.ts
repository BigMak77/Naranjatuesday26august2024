// src/types/userPermissions.ts

/**
 * UserPermission - represents a single permission string for a user.
 * Example: 'admin:manage-users', 'turkus:view', 'health-safety:edit', etc.
 */
export type UserPermission = string;

/**
 * UserPermissions - a list of permissions assigned to a user.
 */
export type UserPermissions = UserPermission[];

/**
 * Example permissions for the Naranja project.
 * Expand as needed for your app's access control.
 */
export const PERMISSIONS = [
  // Admin
  'admin:dashboard',
  'admin:manage-users',
  'admin:manage-roles',
  'admin:manage-departments',
  'admin:manage-compliance',
  // Super Manager
  'super-manager:dashboard',
  'super-manager:manage-users',
  'super-manager:manage-roles',
  'super-manager:manage-departments',
  'super-manager:manage-compliance',
  // Manager
  'manager:dashboard',
  'manager:manage-users',
  'manager:manage-roles',
  'manager:manage-departments',
  // Turkus
  'turkus:view',
  'turkus:assign-task',
  'turkus:manage-auditors',
  'turkus:create-audit',
  'turkus:view-assignments',
  // Health & Safety
  'health-safety:view',
  'health-safety:report-incident',
  'health-safety:manage-firstaiders',
  'health-safety:view-policies',
  'health-safety:view-risk-assessments',
  'health-safety:view-accidents',
  // HR
  'hr:view',
  'hr:manage',
  // Training
  'training:view',
  'training:assign',
  // ...add more as needed
] as const;

export type PermissionKey = typeof PERMISSIONS[number];
