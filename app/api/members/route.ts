import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, User as UserType } from '@/types';

// Members API now returns active users (all users are members)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<UserType[]>>> {
    await dbConnect();
    try {
        // Return all active users as members
        const users = await User.find({ isActive: true }).select('_id name email isActive').sort({ name: 1 }).lean();
        
        // Map to Member-like format for backward compatibility
        const members = users.map((user: any) => ({
            _id: user._id?.toString() || '',
            name: user.name,
            email: user.email,
            active: user.isActive,
        }));
        
        return NextResponse.json({ success: true, data: members as any });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

// POST is deprecated - use /api/users instead
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UserType>>> {
    return NextResponse.json(
        { success: false, error: 'Use /api/users endpoint to create users/members' },
        { status: 400 }
    );
}
