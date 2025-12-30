import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ hasUsers: boolean }>>> {
  try {
    await dbConnect();

    const userCount = await User.countDocuments();
    const hasUsers = userCount > 0;

    return NextResponse.json({
      success: true,
      data: { hasUsers },
    });
  } catch (error) {
    console.error('Check users error:', error);
    // Ensure we always return valid JSON
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Database connection failed' },
      { status: 500 }
    );
  }
}
