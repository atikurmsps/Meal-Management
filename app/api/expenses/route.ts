import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { getCurrentUser } from '@/lib/auth-server';
import { canUserManageMonth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Expense as ExpenseType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ExpenseType[]>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    try {
        const query: any = {};
        // Month is optional - if not provided, return all expenses
        if (month) {
            query.month = month;
        }
        const expenses = await Expense.find(query)
            .populate('paidBy', 'name')
            .populate('splitAmong', 'name')
            .select('date description amount note paidBy splitAmong')
            .sort({ date: -1 })
            .lean();
        return NextResponse.json({ success: true, data: expenses as any });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ExpenseType>>> {
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
        
        const expense = await Expense.create(body);
        return NextResponse.json({ success: true, data: expense }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<ExpenseType>>> {
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

        // Get existing expense to check its month - only select month field for efficiency
        const existingExpense = await Expense.findById(id).select('month').lean() as { month?: string } | null;
        if (!existingExpense || !existingExpense.month) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }

        // Ensure month is derived from date if date is being updated
        const month = updateData.date ? updateData.date.slice(0, 7) : (updateData.month || existingExpense.month);
        updateData.month = month;

        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        const expense = await Expense.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!expense) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: expense });
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

        // Get the expense to check its month - only select month field for efficiency
        const expense = await Expense.findById(id).select('month').lean() as { month?: string } | null;
        if (!expense || !expense.month) {
            return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });
        }
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, expense.month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        await Expense.findByIdAndDelete(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
