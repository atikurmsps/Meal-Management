import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Settings as SettingsType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SettingsType>>> {
    await dbConnect();
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ currentMonth: new Date().toISOString().slice(0, 7) });
        }
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SettingsType>>> {
    await dbConnect();
    try {
        const { currentMonth } = await request.json();
        let settings = await Settings.findOne();
        if (settings) {
            settings.currentMonth = currentMonth;
            await settings.save();
        } else {
            settings = await Settings.create({ currentMonth });
        }
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
