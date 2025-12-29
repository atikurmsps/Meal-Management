'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Utensils, ShoppingCart, Wallet, Receipt } from 'lucide-react';
import AddMealModal from '@/components/AddMealModal';
import AddGroceryModal from '@/components/AddGroceryModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import AddDepositModal from '@/components/AddDepositModal';
import type { DashboardData, Member, ApiResponse } from '@/types';

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isMealModalOpen, setIsMealModalOpen] = useState<boolean>(false);
    const [isGroceryModalOpen, setIsGroceryModalOpen] = useState<boolean>(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);

    const fetchData = useCallback(async () => {
        try {
            const [dashboardRes, membersRes] = await Promise.all([
                fetch('/api/dashboard'),
                fetch('/api/members')
            ]);
            const dashboardData: ApiResponse<DashboardData> = await dashboardRes.json();
            const membersData: ApiResponse<Member[]> = await membersRes.json();

            if (dashboardData.success && dashboardData.data) setData(dashboardData.data);
            if (membersData.success && membersData.data) setMembers(membersData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveMeal = async (mealData: { date: string; meals: { memberId: string; count: number }[] }) => {
        try {
            await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...mealData, month: data?.month }),
            });
            setIsMealModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving meal:', error);
        }
    };

    const handleSaveGrocery = async (groceryData: { doneBy: string; description: string; amount: number; note?: string; date: string }) => {
        try {
            await fetch('/api/groceries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...groceryData, month: data?.month }),
            });
            setIsGroceryModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving grocery:', error);
        }
    };

    const handleSaveExpense = async (expenseData: { paidBy: string; splitAmong: string[]; description: string; amount: number; date: string }) => {
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...expenseData, month: data?.month }),
            });
            setIsExpenseModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    };

    const handleSaveDeposit = async (depositData: { memberId: string; amount: number; date: string }) => {
        try {
            await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...depositData, month: data?.month }),
            });
            setIsDepositModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving deposit:', error);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!data) return <div className="p-8 text-center">Error loading data.</div>;

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold text-foreground tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground text-lg">Overview for {data.month}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setIsMealModalOpen(true)}
                        className="btn inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm"
                    >
                        <Utensils className="h-4 w-4" />
                        Add Meal
                    </button>
                    <button
                        onClick={() => setIsGroceryModalOpen(true)}
                        className="btn inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm"
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Add Grocery
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="btn inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm"
                    >
                        <Receipt className="h-4 w-4" />
                        Add Expense
                    </button>
                    <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="btn inline-flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm border border-border"
                    >
                        <Wallet className="h-4 w-4" />
                        Add Deposit
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Link href="/history/meals" className="block group">
                    <div className="card p-6 h-full group-hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Total Meals</p>
                            <p className="text-3xl font-bold text-foreground">{data.totalMeals.toFixed(1)}</p>
                        </div>
                    </div>
                </Link>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Meal Rate</p>
                        <p className="text-3xl font-bold text-foreground">{data.mealRate.toFixed(2)}</p>
                    </div>
                </div>

                <Link href="/history/groceries" className="block group">
                    <div className="card p-6 h-full group-hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Total Grocery</p>
                            <p className="text-3xl font-bold text-foreground">{data.totalGrocery.toFixed(0)}</p>
                        </div>
                    </div>
                </Link>

                <Link href="/history/deposits" className="block group">
                    <div className="card p-6 h-full group-hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Total Deposit</p>
                            <p className="text-3xl font-bold text-foreground">{data.totalDeposit.toFixed(0)}</p>
                        </div>
                    </div>
                </Link>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Meal Balance</p>
                        <p className={`text-3xl font-bold ${data.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.totalBalance >= 0 ? '+' : ''}{data.totalBalance.toFixed(0)}
                        </p>
                    </div>
                </div>

                <Link href="/history/expenses" className="block group">
                    <div className="card p-6 h-full group-hover:shadow-lg transition-all duration-200">
                        <div className="text-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">Total Expense</p>
                            <p className="text-3xl font-bold text-foreground">{data.totalExpense.toFixed(0)}</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Member Status */}
            <div className="card overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">👥</span>
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Member Status</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Member</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Meals</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Meal Bill</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Deposit</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Meal Balance</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Expense Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.memberStats.map((member, index) => (
                                <tr key={member._id} className="hover:bg-muted/20 transition-colors duration-150">
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/member/${member._id}?month=${data.month}`}
                                            className="inline-flex items-center gap-3 group"
                                            onClick={() => console.log('Navigating to member:', member._id, member.name)}
                                        >
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <span className="text-primary font-semibold text-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {member.name}
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">{member.meals.toFixed(1)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">৳{member.mealBill.toFixed(0)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-foreground">৳{member.deposit.toFixed(0)}</td>
                                    <td className={`px-6 py-4 text-right text-sm font-semibold ${
                                        member.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {member.balance >= 0 ? '+' : ''}৳{member.balance.toFixed(0)}
                                    </td>
                                    <td className={`px-6 py-4 text-right text-sm font-semibold ${
                                        member.expenseBalance >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {member.expenseBalance >= 0 ? '+' : ''}৳{member.expenseBalance.toFixed(0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddMealModal
                isOpen={isMealModalOpen}
                onClose={() => setIsMealModalOpen(false)}
                members={members}
                onSave={handleSaveMeal}
            />
            <AddGroceryModal
                isOpen={isGroceryModalOpen}
                onClose={() => setIsGroceryModalOpen(false)}
                members={members}
                onSave={handleSaveGrocery}
            />
            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                members={members}
                onSave={handleSaveExpense}
            />
            <AddDepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
                members={members}
                onSave={handleSaveDeposit}
            />
        </div>
    );
}
