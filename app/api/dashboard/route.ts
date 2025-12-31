import dbConnect from '@/lib/db';
import Member from '@/models/Member';
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

        // 1. Get all members
        const members = await Member.find({ active: true });

        // 2. Get totals
        const groceries = await Grocery.find({ month });
        const totalGrocery = groceries.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        const meals = await Meal.find({ month });
        const totalMeals = meals.reduce((sum: number, meal: any) => sum + meal.count, 0);

        const deposits = await Deposit.find({ month });
        const totalDeposit = deposits.reduce((sum: number, dep: any) => sum + dep.amount, 0);

        const expenses = await Expense.find({ month });
        const totalExpense = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        // 3. Calculate Meal Rate
        const mealRate = totalMeals > 0 ? totalGrocery / totalMeals : 0;

        // Calculate Total Balance (Deposit - Grocery)
        const totalBalance = totalDeposit - totalGrocery;

        // 4. Calculate Member Stats
        const memberStats: MemberStats[] = members.map((member: any) => {
            const memberMeals = meals
                .filter((m: any) => m.memberId.toString() === member._id.toString())
                .reduce((sum: number, m: any) => sum + m.count, 0);

            const memberDeposit = deposits
                .filter((d: any) => d.memberId.toString() === member._id.toString())
                .reduce((sum: number, d: any) => sum + d.amount, 0);

            // Calculate meal bill only (no expenses)
            const mealBill = memberMeals * mealRate;

            // Calculate member's share of expenses (only expenses they're included in)
            const memberExpenseShare = expenses
                .filter((exp: any) => exp.splitAmong && exp.splitAmong.some((m: any) => m.toString() === member._id.toString()))
                .reduce((sum: number, exp: any) => sum + (exp.amount / exp.splitAmong.length), 0);

            // Calculate how much member paid for expenses
            const memberExpensePaid = expenses
                .filter((exp: any) => exp.paidBy && exp.paidBy.toString() === member._id.toString())
                .reduce((sum: number, exp: any) => sum + exp.amount, 0);

            // Expense balance = what they paid - what they owe
            const expenseBalance = memberExpensePaid - memberExpenseShare;

            // Meal balance = deposit - meal bill only (no expenses)
            const mealBalance = memberDeposit - mealBill;

            // Total bill includes both meal and expense share
            const totalBill = mealBill + memberExpenseShare;

            return {
                _id: member._id,
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
