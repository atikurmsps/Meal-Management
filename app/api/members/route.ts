import dbConnect from '@/lib/db';
import Member from '@/models/Member';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Member as MemberType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MemberType[]>>> {
    await dbConnect();
    try {
        const members = await Member.find({});
        return NextResponse.json({ success: true, data: members });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MemberType>>> {
    await dbConnect();
    try {
        const body = await request.json();
        const member = await Member.create(body);
        return NextResponse.json({ success: true, data: member }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
