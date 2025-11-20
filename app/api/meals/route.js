import dbConnect from '@/lib/db';
import Meal from '@/models/Meal';
import { NextResponse } from 'next/server';

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const memberId = searchParams.get('memberId');

    if (!month) {
        return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
    }

    try {
        const query = { month };
        if (memberId) {
            query.memberId = memberId;
        }
        const meals = await Meal.find(query).populate('memberId', 'name').sort({ date: -1 });
        return NextResponse.json({ success: true, data: meals });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    await dbConnect();
    try {
        const { date, meals, month } = await request.json();

        // meals is an array of { memberId, count }
        // We should delete existing meals for this date and member if count is 0? 
        // Or just upsert?
        // Strategy: Loop through meals and upsert.

        const operations = meals.map(async (meal) => {
            if (meal.count > 0) {
                return Meal.findOneAndUpdate(
                    { date: date, memberId: meal.memberId },
                    { count: meal.count, month: month },
                    { upsert: true, new: true }
                );
            } else {
                // If count is 0, remove the entry if it exists
                return Meal.findOneAndDelete({ date: date, memberId: meal.memberId });
            }
        });

        await Promise.all(operations);

        return NextResponse.json({ success: true });
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

        const meal = await Meal.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!meal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: meal });
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

        const meal = await Meal.findByIdAndDelete(id);

        if (!meal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
