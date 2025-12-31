import dbConnect from '@/lib/db';
import User from '@/models/User';
import Meal from '@/models/Meal';
import Grocery from '@/models/Grocery';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { DashboardData, MemberStats, ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DashboardData>>> {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    let month = searchParams.get('month');

    try {
        if (!month) {
            const settings = await Settings.findOne();
            month = settings?.currentMonth || new Date().toISOString().slice(0, 7);
        }

        // Ensure month is always a string
        const currentMonth: string = month as string;

        // 1. Get all active users (users are members) - only select needed fields
        const members = await User.find({ isActive: true }).select('_id name').lean();

        // 2. Get totals using aggregation for better performance
        const [groceryResult, mealResult, depositResult, expenseResult] = await Promise.all([
            Grocery.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Meal.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]),
            Deposit.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { month } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const totalGrocery = groceryResult[0]?.total || 0;
        const totalMeals = mealResult[0]?.total || 0;
        const totalDeposit = depositResult[0]?.total || 0;
        const totalExpense = expenseResult[0]?.total || 0;

        // 3. Calculate Meal Rate
        const mealRate = totalMeals > 0 ? totalGrocery / totalMeals : 0;

        // Calculate Total Balance (Deposit - Grocery)
        const totalBalance = totalDeposit - totalGrocery;

        // 4. Calculate Member Stats using aggregation for better performance
        const [memberMealsData, memberDepositsData, memberExpensesData] = await Promise.all([
            Meal.aggregate([
                { $match: { month } },
                { $group: { _id: '$memberId', total: { $sum: '$count' } } }
            ]),
            Deposit.aggregate([
                { $match: { month } },
                { $group: { _id: '$memberId', total: { $sum: '$amount' } } }
            ]),
            Expense.find({ month }).select('amount paidBy splitAmong').lean()
        ]);

        // Create maps for O(1) lookup
        const mealsMap = new Map(memberMealsData.map((m: any) => [m._id.toString(), m.total]));
        const depositsMap = new Map(memberDepositsData.map((d: any) => [d._id.toString(), d.total]));

        // Calculate member stats
        const memberStats: MemberStats[] = members.map((member: any) => {
            const memberIdStr = member._id.toString();
            const memberMeals = mealsMap.get(memberIdStr) || 0;
            const memberDeposit = depositsMap.get(memberIdStr) || 0;

            // Calculate meal bill only (no expenses)
            const mealBill = memberMeals * mealRate;

            // Calculate member's share of expenses (only expenses they're included in)
            const memberExpenseShare = memberExpensesData
                .filter((exp: any) => exp.splitAmong && exp.splitAmong.some((m: any) => m.toString() === memberIdStr))
                .reduce((sum: number, exp: any) => sum + (exp.amount / exp.splitAmong.length), 0);

            // Calculate how much member paid for expenses
            const memberExpensePaid = memberExpensesData
                .filter((exp: any) => exp.paidBy && exp.paidBy.toString() === memberIdStr)
                .reduce((sum: number, exp: any) => sum + exp.amount, 0);

            // Expense balance = what they paid - what they owe
            const expenseBalance = memberExpensePaid - memberExpenseShare;

            // Meal balance = deposit - meal bill only (no expenses)
            const mealBalance = memberDeposit - mealBill;

            // Total bill includes both meal and expense share
            const totalBill = mealBill + memberExpenseShare;

            return {
                _id: member._id.toString(),
                name: member.name,
                meals: memberMeals,
                deposit: memberDeposit,
                mealBill: mealBill,
                expenseBalance: expenseBalance,
                bill: totalBill,
                balance: mealBalance
            };
        });

        const responseData: DashboardData = {
            month: currentMonth,
                totalGrocery,
                totalMeals,
                totalDeposit,
                totalExpense,
                totalBalance,
                mealRate,
                memberStats
        };

        return NextResponse.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'An error occurred' }, { status: 400 });
    }
}
