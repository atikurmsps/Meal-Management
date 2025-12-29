import dbConnect from '@/lib/db';
import Member from '@/models/Member';
import Meal from '@/models/Meal';
import Grocery from '@/models/Grocery';
import Expense from '@/models/Expense';
import Deposit from '@/models/Deposit';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        console.log('API Route called with URL:', request.url);
        console.log('API Route - params:', params);
        console.log('API Route - params type:', typeof params);

        await dbConnect();

        // Handle params - in Next.js 15+, params might be a Promise
        const resolvedParams = params instanceof Promise ? await params : params;
        const { memberId } = resolvedParams;
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
        const totalDeposit = deposits.reduce((sum, dep) => sum + dep.amount, 0);
        const totalGrocery = groceries.reduce((sum, groc) => sum + groc.amount, 0);
        const totalMeals = meals.reduce((sum, meal) => sum + meal.count, 0);

        // Calculate meal rate
        const allMealsCount = allMeals.reduce((sum, meal) => sum + meal.count, 0);
        const allGroceriesAmount = allGroceries.reduce((sum, groc) => sum + groc.amount, 0);
        const mealRate = allMealsCount > 0 ? allGroceriesAmount / allMealsCount : 0;

        const totalMealBill = totalMeals * mealRate;

        // Calculate expense balance
        const memberExpensePaid = expenses
            .filter(exp => exp.paidBy && exp.paidBy._id.toString() === memberId)
            .reduce((sum, exp) => sum + exp.amount, 0);

        const memberExpenseShare = expenses
            .filter(exp => exp.splitAmong && exp.splitAmong.some(m => m._id.toString() === memberId))
            .reduce((sum, exp) => sum + (exp.amount / exp.splitAmong.length), 0);

        const expenseBalance = memberExpensePaid - memberExpenseShare;
        const currentBalance = totalDeposit - totalMealBill;

        // Filter expenses for this member
        const memberExpenses = expenses
            .filter(exp =>
                (exp.paidBy && exp.paidBy._id.toString() === memberId) ||
                (exp.splitAmong && exp.splitAmong.some(m => m._id.toString() === memberId))
            )
            .map(exp => {
                const paid = exp.paidBy && exp.paidBy._id.toString() === memberId ? exp.amount : 0;
                const share = exp.splitAmong && exp.splitAmong.some(m => m._id.toString() === memberId)
                    ? exp.amount / exp.splitAmong.length
                    : 0;
                return {
                    ...exp.toObject(),
                    memberPaid: paid,
                    memberShare: share,
                    memberBalance: paid - share
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

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
            error: error.message || 'An error occurred while fetching member data' 
        }, { status: 500 });
    }
}
