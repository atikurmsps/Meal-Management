import dbConnect from '@/lib/db';
import Deposit from '@/models/Deposit';
import { NextResponse } from 'next/server';

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
    }

    try {
        const deposits = await Deposit.find({ month }).populate('memberId', 'name');
        return NextResponse.json({ success: true, data: deposits });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        const deposit = await Deposit.create(body);
        return NextResponse.json({ success: true, data: deposit }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
