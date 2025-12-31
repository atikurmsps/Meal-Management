import dbConnect from '@/lib/db';
import Grocery from '@/models/Grocery';
import { getCurrentUser } from '@/lib/auth-server';
import { canUserManageMonth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Grocery as GroceryType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<GroceryType[]>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    try {
        const query: any = {};
        // Month is optional - if not provided, return all groceries
        if (month) {
            query.month = month;
        }
        const groceries = await Grocery.find(query)
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
    
    // Check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        
        // Ensure month is derived from date if not provided or if date is provided
        const month = body.date ? body.date.slice(0, 7) : body.month; // Extract YYYY-MM from YYYY-MM-DD
        body.month = month;
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }
        
        const grocery = await Grocery.create(body);
        return NextResponse.json({ success: true, data: grocery }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<GroceryType>>> {
    await dbConnect();
    
    // Check permissions
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        // Get existing grocery to check its month
        const existingGrocery = await Grocery.findById(id);
        if (!existingGrocery) {
            return NextResponse.json({ success: false, error: 'Grocery not found' }, { status: 404 });
        }

        // Ensure month is derived from date if date is being updated
        const month = updateData.date ? updateData.date.slice(0, 7) : (updateData.month || existingGrocery.month);
        updateData.month = month;

        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
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

        // Get the grocery to check its month
        const grocery = await Grocery.findById(id);
        if (!grocery) {
            return NextResponse.json({ success: false, error: 'Grocery not found' }, { status: 404 });
        }
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, grocery.month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        await Grocery.findByIdAndDelete(id);

        if (!grocery) {
            return NextResponse.json({ success: false, error: 'Grocery not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
