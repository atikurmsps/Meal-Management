import dbConnect from '@/lib/db';
import Deposit from '@/models/Deposit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Deposit as DepositType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType[]>>> {
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
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType>>> {
    await dbConnect();
    try {
        const body = await request.json();
        const deposit = await Deposit.create(body);
        return NextResponse.json({ success: true, data: deposit }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType>>> {
    await dbConnect();
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        const deposit = await Deposit.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!deposit) {
            return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deposit });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        const deposit = await Deposit.findByIdAndDelete(id);

        if (!deposit) {
            return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
