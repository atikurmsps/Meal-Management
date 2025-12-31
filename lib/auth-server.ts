import { cookies } from 'next/headers';
import User from '@/models/User';
import { verifyToken } from './auth';
import type { AuthUser, UserPermissions } from '@/types';

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }

    // Verify user still exists and is active - only select needed fields
    const user = await User.findById(decoded._id).select('_id phoneNumber name role assignedMonth isActive').lean() as {
      _id: any;
      phoneNumber: string;
      name: string;
      role: string;
      assignedMonth?: string;
      isActive: boolean;
    } | null;
    if (!user || !user.isActive) {
      return null;
    }

    return {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role as 'general' | 'manager' | 'super',
      assignedMonth: user.assignedMonth,
    };
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
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
    canViewAll: user.role === 'super' || user.role === 'manager',
    canManageMembers: user.role === 'super',
    canManageData: user.role === 'super',
    canManageCurrentMonth: user.role === 'super',
    canManageAssignedMonth: false,
    assignedMonth: user.assignedMonth,
  };

  if (user.role === 'manager' && user.assignedMonth) {
    permissions.canManageAssignedMonth = true;
  }

  return permissions;
}

export function canUserManageMonth(user: AuthUser | null, month: string): boolean {
  if (!user) return false;

  if (user.role === 'super') return true;
  if (user.role === 'manager' && user.assignedMonth === month) return true;

  return false;
}

export async function createSuperAdmin(phoneNumber: string, password: string, name: string): Promise<AuthUser> {
  const { hashPassword } = await import('./auth');

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    phoneNumber,
    password: hashedPassword,
    name,
    role: 'super',
    isActive: true,
  });

  return {
    _id: user._id.toString(),
    phoneNumber: user.phoneNumber,
    name: user.name,
    role: user.role,
  };
}
