import dbConnect from '@/lib/db';
import Member from '@/models/Member';
import Meal from '@/models/Meal';
import Grocery from '@/models/Grocery';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MemberProfileData, MemberExpense, ApiResponse } from '@/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }): Promise<NextResponse<ApiResponse<MemberProfileData>>> {
    try {
        console.log('API Route called with URL:', request.url);

        await dbConnect();

        const resolvedParams = await params;
        const { memberId } = resolvedParams;
        console.log('API Route - memberId:', memberId);
        console.log('API Route - memberId:', memberId);

        if (!memberId) {
            console.log('API Route - memberId is falsy');
            return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');
        console.log('Month parameter:', month);

        if (!month) {
            console.log('Month parameter is missing');
            return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
        }

        // Get member info
        console.log('Looking up member with ID:', memberId);
        const member = await Member.findById(memberId);
        console.log('Member found:', !!member, member?.name);

        if (!member) {
            console.log('Member not found for ID:', memberId);
            // Let's also check how many members exist
            const totalMembers = await Member.countDocuments();
            console.log('Total members in database:', totalMembers);
            return NextResponse.json({ success: false, error: 'Member not found' }, { status: 404 });
        }

        // Get all data for calculations
        const [meals, groceries, deposits, expenses, allMeals, allGroceries] = await Promise.all([
            Meal.find({ memberId, month }).sort({ date: -1 }),
            Grocery.find({ doneBy: memberId, month }).sort({ date: -1 }),
            Deposit.find({ memberId, month }).sort({ date: -1 }),
            Expense.find({ month }).populate('paidBy', 'name').populate('splitAmong', 'name'),
            Meal.find({ month }),
            Grocery.find({ month })
        ]);

        // Calculate totals
        const totalDeposit = deposits.reduce((sum: number, dep: any) => sum + dep.amount, 0);
        const totalGrocery = groceries.reduce((sum: number, groc: any) => sum + groc.amount, 0);
        const totalMeals = meals.reduce((sum: number, meal: any) => sum + meal.count, 0);

        // Calculate meal rate
        const allMealsCount = allMeals.reduce((sum: number, meal: any) => sum + meal.count, 0);
        const allGroceriesAmount = allGroceries.reduce((sum: number, groc: any) => sum + groc.amount, 0);
        const mealRate = allMealsCount > 0 ? allGroceriesAmount / allMealsCount : 0;

        const totalMealBill = totalMeals * mealRate;

        // Calculate expense balance
        const memberExpensePaid = expenses
            .filter((exp: any) => exp.paidBy && exp.paidBy._id.toString() === memberId)
            .reduce((sum: number, exp: any) => sum + exp.amount, 0);

        const memberExpenseShare = expenses
            .filter((exp: any) => exp.splitAmong && exp.splitAmong.some((m: any) => m._id.toString() === memberId))
            .reduce((sum: number, exp: any) => sum + (exp.amount / exp.splitAmong.length), 0);

        const expenseBalance = memberExpensePaid - memberExpenseShare;
        const currentBalance = totalDeposit - totalMealBill;

        // Filter expenses for this member
        const memberExpenses: MemberExpense[] = expenses
            .filter((exp: any) =>
                (exp.paidBy && exp.paidBy._id.toString() === memberId) ||
                (exp.splitAmong && exp.splitAmong.some((m: any) => m._id.toString() === memberId))
            )
            .map((exp: any) => {
                const paid = exp.paidBy && exp.paidBy._id.toString() === memberId ? exp.amount : 0;
                const share = exp.splitAmong && exp.splitAmong.some((m: any) => m._id.toString() === memberId)
                    ? exp.amount / exp.splitAmong.length
                    : 0;
                return {
                    ...exp.toObject(),
                    memberPaid: paid,
                    memberShare: share,
                    memberBalance: paid - share
                };
            })
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            success: true,
            data: {
                member: {
                    _id: member._id,
                    name: member.name
                },
                summary: {
                    totalDeposit,
                    totalGrocery,
                    totalMeals,
                    totalMealBill,
                    currentBalance,
                    expenseBalance
                },
                history: {
                    deposits,
                    meals,
                    groceries,
                    expenses: memberExpenses
                }
            }
        });
    } catch (error) {
        console.error('Error in member API:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'An error occurred while fetching member data'
        }, { status: 500 });
    }
}
