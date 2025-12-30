import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getUserPermissions } from '@/lib/auth-server';
import type { ApiResponse, AuthUser, UserPermissions } from '@/types';

interface AuthMeResponse {
  user: AuthUser;
  permissions: UserPermissions;
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AuthMeResponse>>> {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get current month from query params or default
    const { searchParams } = new URL(request.url);
    const currentMonth = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    const permissions = getUserPermissions(currentUser, currentMonth);

    return NextResponse.json({
      success: true,
      data: {
        user: currentUser,
        permissions,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
