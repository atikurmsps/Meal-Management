import dbConnect from '@/lib/db';
import Deposit from '@/models/Deposit';
import { getCurrentUser } from '@/lib/auth-server';
import { canUserManageMonth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { ApiResponse, Deposit as DepositType } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType[]>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    try {
        const query: any = {};
        // Month is optional - if not provided, return all deposits
        if (month) {
            query.month = month;
        }
        const deposits = await Deposit.find(query).populate('memberId', 'name').select('-__v').sort({ date: -1 }).lean();
        return NextResponse.json({ success: true, data: deposits as any });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType>>> {
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
        
        const deposit = await Deposit.create(body);
        return NextResponse.json({ success: true, data: deposit }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<DepositType>>> {
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

        // Get existing deposit to check its month
        const existingDeposit = await Deposit.findById(id);
        if (!existingDeposit) {
            return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
        }

        // Ensure month is derived from date if date is being updated
        const month = updateData.date ? updateData.date.slice(0, 7) : (updateData.month || existingDeposit.month);
        updateData.month = month;

        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
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

        // Get the deposit to check its month
        const deposit = await Deposit.findById(id);
        if (!deposit) {
            return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
        }
        
        // Check if user can manage this month
        if (!canUserManageMonth(currentUser, deposit.month)) {
            return NextResponse.json({ success: false, error: 'You do not have permission to manage data for this month' }, { status: 403 });
        }

        await Deposit.findByIdAndDelete(id);

        if (!deposit) {
            return NextResponse.json({ success: false, error: 'Deposit not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
