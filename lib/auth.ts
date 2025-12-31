import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { AuthUser, UserPermissions } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      _id: user._id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      assignedMonth: user.assignedMonth,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getUserPermissions(user: AuthUser | null, currentMonth: string): UserPermissions {
  if (!user) {
    return {
      canViewAll: false,
      canManageMembers: false,
      canManageData: false,
      canManageCurrentMonth: false,
      canManageAssignedMonth: false,
    };
  }

  const permissions: UserPermissions = {
    canViewAll: true, // All authenticated users can view
    canManageMembers: user.role === 'super',
    canManageData: user.role === 'super' || user.role === 'manager', // Super users and managers can manage data
    canManageCurrentMonth: false, // Will be set based on role and month
    canManageAssignedMonth: false,
    assignedMonth: user.assignedMonth,
  };

  // Super users can manage any month
  if (user.role === 'super') {
    permissions.canManageCurrentMonth = true;
    permissions.canManageAssignedMonth = true;
  } 
  // Managers can manage their assigned month
  else if (user.role === 'manager' && user.assignedMonth) {
    permissions.canManageAssignedMonth = true;
    if (user.assignedMonth === currentMonth) {
      permissions.canManageCurrentMonth = true;
    }
  }
  // General users have no management permissions (already set to false above)

  return permissions;
}

export function canUserManageMonth(user: AuthUser | null, month: string): boolean {
  if (!user) return false;

  if (user.role === 'super') return true;
  if (user.role === 'manager' && user.assignedMonth === month) return true;

  return false;
}

