import dbConnect from '@/lib/db';
import Meal from '@/models/Meal';
import { getCurrentUser } from '@/lib/auth-server';
import { canUserManageMonth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Meal as MealType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MealType[]>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const memberId = searchParams.get('memberId');

    try {
        const query: any = {};
        // Month is optional - if not provided, return all meals
        if (month) {
            query.month = month;
        }
        if (memberId) {
            query.memberId = memberId;
        }
        const meals = await Meal.find(query).populate('memberId', 'name').sort({ date: -1 });
        return NextResponse.json({ success: true, data: meals });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
    await dbConnect();
    
    // Check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { date, meals, month: providedMonth } = await request.json();
        
        // Extract month from date if not provided or override with date's month
        const month = date ? date.slice(0, 7) : providedMonth; // Extract YYYY-MM from YYYY-MM-DD
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        // meals is an array of { memberId, count }
        // We should delete existing meals for this date and member if count is 0? 
        // Or just upsert?
        // Strategy: Loop through meals and upsert.

        const operations = meals.map(async (meal: { memberId: string; count: number }) => {
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
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
    await dbConnect();
    
    // Check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        const { id, month, ...updateData } = body;
        
        // Get the meal to check its month
        const existingMeal = await Meal.findById(id);
        if (!existingMeal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }
        
        // Check if user can manage this month
        const mealMonth = month || existingMeal.month;
        if (!canUserManageMonth(currentUser, mealMonth)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        const meal = await Meal.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!meal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: meal });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
    await dbConnect();
    
    // Check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        // Get the meal to check its month
        const meal = await Meal.findById(id);
        if (!meal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, meal.month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        await Meal.findByIdAndDelete(id);

        if (!meal) {
            return NextResponse.json({ success: false, error: 'Meal not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
