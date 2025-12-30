/**
 * Role Management Utilities
 * 
 * Helper functions for role hierarchy and permission checking.
 * Separated from schema.ts to follow best practices (types vs runtime logic).
 * 
 * @version 1.0
 * @date December 30, 2025
 */

import { ROLE_HIERARCHY, type Role, type TenantRoleAssignment } from '../types/schema';
import { parseFirestoreDate } from './dateUtils';

/**
 * Check if user has minimum role level
 * 
 * Uses role hierarchy levels to determine if userRole meets or exceeds requiredRole.
 * 
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient permissions
 * 
 * @example
 * hasMinimumRole('admin', 'organizer') // true (3 >= 2)
 * hasMinimumRole('moderator', 'admin') // false (1 < 3)
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole].level >= ROLE_HIERARCHY[requiredRole].level;
}

/**
 * Calculate highest active role from tenantRoles map
 * 
 * Iterates through all tenant roles and returns the highest level active role.
 * Checks for expiration and active status.
 * 
 * @param tenantRoles - Map of tenant IDs to role assignments
 * @param isSuperadmin - Whether user is a superadmin
 * @returns The highest active role
 * 
 * @example
 * calculateHighestRole({ 'tenant1': { role: 'admin', isActive: true, ... } })
 * // Returns: 'admin'
 */
export function calculateHighestRole(
  tenantRoles: Record<string, TenantRoleAssignment> | undefined,
  isSuperadmin: boolean = false
): Role {
  if (isSuperadmin) return 'superadmin';
  
  if (!tenantRoles || Object.keys(tenantRoles).length === 0) {
    return 'player';
  }
  
  let highestLevel = 0;
  let highestRole: Role = 'player';
  
  for (const tenantId in tenantRoles) {
    const assignment = tenantRoles[tenantId];
    const expiresAt = parseFirestoreDate(assignment.expiresAt);
    if (assignment.isActive && (!expiresAt || expiresAt > new Date())) {
      const roleLevel = ROLE_HIERARCHY[assignment.role].level;
      if (roleLevel > highestLevel) {
        highestLevel = roleLevel;
        highestRole = assignment.role;
      }
    }
  }
  
  return highestRole;
}

/**
 * Check if role inherits from another role
 * 
 * @param userRole - The user's role
 * @param targetRole - The role to check inheritance for
 * @returns true if userRole inherits targetRole
 * 
 * @example
 * inheritsRole('admin', 'moderator') // true
 * inheritsRole('moderator', 'admin') // false
 */
export function inheritsRole(userRole: Role, targetRole: Role): boolean {
  const inherits = ROLE_HIERARCHY[userRole].inherits as readonly Role[];
  return inherits.includes(targetRole);
}

/**
 * Get all roles that a user role can access
 * 
 * @param userRole - The user's role
 * @returns Array of all accessible roles (including the user's own role)
 * 
 * @example
 * getAccessibleRoles('admin') // ['admin', 'organizer', 'moderator', 'player']
 */
export function getAccessibleRoles(userRole: Role): Role[] {
  return [userRole, ...ROLE_HIERARCHY[userRole].inherits] as Role[];
}

/**
 * Check if a tenant role assignment is currently valid
 * 
 * @param assignment - The role assignment to check
 * @returns true if active and not expired
 */
export function isRoleAssignmentValid(assignment: TenantRoleAssignment): boolean {
  if (!assignment.isActive) return false;
  const expiresAt = parseFirestoreDate(assignment.expiresAt);
  if (expiresAt && expiresAt < new Date()) return false;
  return true;
}
