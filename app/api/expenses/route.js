import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { NextResponse } from 'next/server';

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
    }

    try {
        const expenses = await Expense.find({ month })
            .populate('paidBy', 'name')
            .populate('splitAmong', 'name')
            .sort({ date: -1 });
        return NextResponse.json({ success: true, data: expenses });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const body = await request.json();
        const expense = await Expense.create(body);
        return NextResponse.json({ success: true, data: expense }, { status: 201 });
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

        const expense = await Expense.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!expense) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: expense });
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

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
