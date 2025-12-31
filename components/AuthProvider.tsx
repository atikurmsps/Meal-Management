'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser, UserPermissions } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  permissions: UserPermissions;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>({
    canViewAll: false,
    canManageMembers: false,
    canManageData: false,
    canManageCurrentMonth: false,
    canManageAssignedMonth: false,
  });
  const router = useRouter();
  const pathname = usePathname();

  // Auth-only routes (don't show sidebar)
  const authRoutes = ['/login', '/signup'];

  const refreshAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        // 401 is expected when not authenticated - don't log as error
        if (response.status !== 401) {
          console.error('Auth me API failed:', response.status, response.statusText);
        }
        setUser(null);
        setPermissions({
          canViewAll: false,
          canManageMembers: false,
          canManageData: false,
          canManageCurrentMonth: false,
          canManageAssignedMonth: false,
        });
        return;
      }

      const data = await response.json();

      if (data.success && data.data) {
        const currentUser = data.data.user;
        setUser(currentUser);

        // Get current month from localStorage or default
        const currentMonth = typeof window !== 'undefined'
          ? localStorage.getItem('currentMonth') || new Date().toISOString().slice(0, 7)
          : new Date().toISOString().slice(0, 7);

        const userPermissions = data.data.permissions;
        setPermissions(userPermissions);
      } else {
        setUser(null);
        setPermissions({
          canViewAll: false,
          canManageMembers: false,
          canManageData: false,
          canManageCurrentMonth: false,
          canManageAssignedMonth: false,
        });
      }
    } catch (error) {
      // Only log unexpected errors (network issues, etc.)
      // Don't log if it's just a failed fetch due to no auth
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - might be expected in some cases
        console.warn('Auth refresh network error:', error);
      } else {
        console.error('Auth refresh error:', error);
      }
      setUser(null);
      setPermissions({
        canViewAll: false,
        canManageMembers: false,
        canManageData: false,
        canManageCurrentMonth: false,
        canManageAssignedMonth: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsersExist = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-users');
      if (!response.ok) {
        console.error('Check users API failed:', response.status, response.statusText);
        return false;
      }

      const data = await response.json();
      return data.success && data.data?.hasUsers;
    } catch (error) {
      console.error('Check users fetch error:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  // Handle redirects based on authentication state
  useEffect(() => {
    const handleRedirects = async () => {
      if (!isLoading) {
        const isAuthRoute = authRoutes.includes(pathname);
        const isHomePage = pathname === '/';

        if (!user && !isAuthRoute) {
          // Check if users exist
          const usersExist = await checkUsersExist();
          if (!usersExist) {
            // No users exist, redirect to signup
            router.push('/signup');
          } else {
            // Users exist, redirect to login
            router.push('/login');
          }
        } else if (user && isAuthRoute) {
          // Authenticated but on auth page - redirect to home
          router.push('/');
        }
      }
    };

    handleRedirects();
  }, [user, isLoading, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages without sidebar
  if (authRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Show main app - Layout component handles sidebar
  if (user) {
    return (
      <AuthContext.Provider value={{ user, permissions, isLoading, refreshAuth }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // This shouldn't happen due to the redirect logic above, but just in case
  return null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
