import dbConnect from '@/lib/db';
import User from '@/models/User';
import Meal from '@/models/Meal';
import Grocery from '@/models/Grocery';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { MemberProfileData, MemberExpense, ApiResponse } from '@/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }): Promise<NextResponse<ApiResponse<MemberProfileData>>> {
    try {
        await dbConnect();

        const resolvedParams = await params;
        const { memberId } = resolvedParams;

        if (!memberId) {
            return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get('month');

        if (!month) {
            return NextResponse.json({ success: false, error: 'Month is required' }, { status: 400 });
        }

        // Get user/member info (users are members) - only select needed fields
        const member = await User.findById(memberId).select('_id name').lean() as any;

        if (!member) {
            return NextResponse.json({ success: false, error: 'User/Member not found' }, { status: 404 });
        }

        // Get all data for calculations using aggregation and lean for better performance
        const [meals, groceries, deposits, expenses, mealTotals, groceryTotals, depositTotal, groceryTotal, mealTotal] = await Promise.all([
            Meal.find({ memberId, month }).select('date count').sort({ date: -1 }).lean(),
            Grocery.find({ doneBy: memberId, month }).select('date amount description note').sort({ date: -1 }).lean(),
            Deposit.find({ memberId, month }).select('date amount').sort({ date: -1 }).lean(),
            Expense.find({ month }).populate('paidBy', 'name').populate('splitAmong', 'name').select('date description amount note paidBy splitAmong').lean(),
            Meal.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]),
            Grocery.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Deposit.aggregate([
                { $match: { memberId, month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Grocery.aggregate([
                { $match: { doneBy: memberId, month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Meal.aggregate([
                { $match: { memberId, month } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ])
        ]);

        // Calculate totals using aggregation results (faster than reduce)
        const totalDeposit = depositTotal[0]?.total || 0;
        const totalGrocery = groceryTotal[0]?.total || 0;
        const totalMeals = mealTotal[0]?.total || 0;

        // Calculate meal rate using aggregation results
        const allMealsCount = mealTotals[0]?.total || 0;
        const allGroceriesAmount = groceryTotals[0]?.total || 0;
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
                    ...exp,
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
                    _id: member._id.toString(),
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
                    deposits: deposits as any,
                    meals: meals as any,
                    groceries: groceries as any,
                    expenses: memberExpenses as any
                }
            }
        } as any);
    } catch (error) {
        console.error('Error in member API:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'An error occurred while fetching member data'
        }, { status: 500 });
    }
}
