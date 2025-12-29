import dbConnect from '@/lib/db';
import Grocery from '@/models/Grocery';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Grocery as GroceryType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GroceryType[]>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
    }

    try {
        const groceries = await Grocery.find({ month })
            .populate('doneBy', 'name')
            .populate('addedBy', 'name')
            .sort({ date: -1 });
        return NextResponse.json({ success: true, data: groceries });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<GroceryType>>> {
    await dbConnect();
    try {
        const body = await request.json();
        const grocery = await Grocery.create(body);
        return NextResponse.json({ success: true, data: grocery }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<GroceryType>>> {
    await dbConnect();
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        const grocery = await Grocery.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!grocery) {
            return NextResponse.json({ success: false, error: 'Grocery not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: grocery });
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

        const grocery = await Grocery.findByIdAndDelete(id);

        if (!grocery) {
            return NextResponse.json({ success: false, error: 'Grocery not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
