import dbConnect from '@/lib/db';
import Member from '@/models/Member';
import Meal from '@/models/Meal';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import Settings from '@/models/Settings';
import { NextResponse } from 'next/server';

export async function GET(request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    let month = searchParams.get('month');

    try {
        if (!month) {
            const settings = await Settings.findOne();
            month = settings?.currentMonth || new Date().toISOString().slice(0, 7);
        }

        // 1. Get all members
        const members = await Member.find({ active: true });

        // 2. Get totals
        const expenses = await Expense.find({ month });
        const totalGrocery = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        const meals = await Meal.find({ month });
        const totalMeals = meals.reduce((sum, meal) => sum + meal.count, 0);

        const deposits = await Deposit.find({ month });
        const totalDeposit = deposits.reduce((sum, dep) => sum + dep.amount, 0);

        // 3. Calculate Meal Rate
        const mealRate = totalMeals > 0 ? totalGrocery / totalMeals : 0;

        // Calculate Total Balance (Deposit - Grocery)
        const totalBalance = totalDeposit - totalGrocery;

        // 4. Calculate Member Stats
        const memberStats = members.map(member => {
            const memberMeals = meals
                .filter(m => m.memberId.toString() === member._id.toString())
                .reduce((sum, m) => sum + m.count, 0);

            const memberDeposit = deposits
                .filter(d => d.memberId.toString() === member._id.toString())
                .reduce((sum, d) => sum + d.amount, 0);

            const bill = memberMeals * mealRate;
            const balance = memberDeposit - bill;

            return {
                _id: member._id,
                name: member.name,
                meals: memberMeals,
                deposit: memberDeposit,
                bill: bill,
                balance: balance
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                month,
                totalGrocery,
                totalMeals,
                totalDeposit,
                totalBalance,
                mealRate,
                memberStats
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
