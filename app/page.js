'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Utensils, ShoppingCart, Wallet } from 'lucide-react';
import AddMealModal from '@/components/AddMealModal';
import AddExpenseModal from '@/components/AddExpenseModal';
import AddDepositModal from '@/components/AddDepositModal';

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [dashboardRes, membersRes] = await Promise.all([
                fetch('/api/dashboard'),
                fetch('/api/members')
            ]);
            const dashboardData = await dashboardRes.json();
            const membersData = await membersRes.json();

            if (dashboardData.success) setData(dashboardData.data);
            if (membersData.success) setMembers(membersData.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveMeal = async (mealData) => {
        try {
            await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...mealData, month: data.month }),
            });
            setIsMealModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving meal:', error);
        }
    };

    const handleSaveExpense = async (expenseData) => {
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...expenseData, month: data.month }),
            });
            setIsExpenseModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    };

    const handleSaveDeposit = async (depositData) => {
        try {
            await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...depositData, month: data.month }),
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
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                    <p className="text-muted-foreground">Overview for {data.month}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMealModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Utensils className="h-4 w-4" /> Add Meal
                    </button>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                    >
                        <ShoppingCart className="h-4 w-4" /> Add Expense
                    </button>
                    <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                    >
                        <Wallet className="h-4 w-4" /> Add Deposit
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Meals</div>
                    <div className="mt-2 text-3xl font-bold">{data.totalMeals.toFixed(1)}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Meal Rate</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.mealRate.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Grocery</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.totalGrocery.toFixed(0)}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Deposit</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.totalDeposit.toFixed(0)}</div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Balance</div>
                    <div className={`mt-2 text-3xl font-bold ${data.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.totalBalance >= 0 ? '+' : ''}৳{data.totalBalance.toFixed(0)}
                    </div>
                </div>
            </div>

            {/* Member Table */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Member Status</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-right">Meals</th>
                                <th className="px-6 py-3 font-medium text-right">Bill</th>
                                <th className="px-6 py-3 font-medium text-right">Deposit</th>
                                <th className="px-6 py-3 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.memberStats.map((member) => (
                                <tr key={member._id} className="hover:bg-muted/10">
                                    <td className="px-6 py-4 font-medium">{member.name}</td>
                                    <td className="px-6 py-4 text-right">{member.meals.toFixed(1)}</td>
                                    <td className="px-6 py-4 text-right">৳{member.bill.toFixed(0)}</td>
                                    <td className="px-6 py-4 text-right">৳{member.deposit.toFixed(0)}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${member.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {member.balance >= 0 ? '+' : ''}৳{member.balance.toFixed(0)}
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
            <AddExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
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
