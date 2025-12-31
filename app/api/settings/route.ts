import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Settings as SettingsType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SettingsType>>> {
    await dbConnect();
    try {
        let settings = await Settings.findOne().lean() as SettingsType | null;
        if (!settings) {
            const newSettings = await Settings.create({ currentMonth: new Date().toISOString().slice(0, 7) });
            settings = newSettings.toObject() as SettingsType;
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
        const settings = await Settings.findOneAndUpdate(
            {},
            { currentMonth },
            { upsert: true, new: true, runValidators: true }
        ).lean() as unknown as SettingsType;
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
