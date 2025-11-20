import dbConnect from '@/lib/db';
import Grocery from '@/models/Grocery';
import { NextResponse } from 'next/server';

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
    }

    try {
        const groceries = await Grocery.find({ month }).populate('addedBy', 'name');
        return NextResponse.json({ success: true, data: groceries });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        const grocery = await Grocery.create(body);
        return NextResponse.json({ success: true, data: grocery }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PUT(request) {
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
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request) {
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

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
