'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function MemberProfileContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const memberId = params.memberId;
    const [month, setMonth] = useState(searchParams.get('month') || new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!memberId) return;
        
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/user/${memberId}?month=${month}`);
            const result = await res.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to load member data');
            }
        } catch (error) {
            console.error('Error fetching member data:', error);
            setError(error.message || 'An error occurred while fetching member data');
        } finally {
            setLoading(false);
        }
    }, [memberId, month]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <div className="text-red-600 font-semibold">Error: {error}</div>
                <Link href="/" className="text-primary hover:underline">
                    <ArrowLeft className="h-6 w-6 inline mr-2" />
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
                <div className="text-muted-foreground">Member not found</div>
                <Link href="/" className="text-primary hover:underline">
                    <ArrowLeft className="h-6 w-6 inline mr-2" />
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-primary">{data.member.name}'s Profile</h1>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Deposit</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.summary.totalDeposit.toFixed(0)}</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Grocery</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.summary.totalGrocery.toFixed(0)}</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Meals</div>
                    <div className="mt-2 text-3xl font-bold">{data.summary.totalMeals.toFixed(1)}</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Total Meal Bill</div>
                    <div className="mt-2 text-3xl font-bold">৳{data.summary.totalMealBill.toFixed(0)}</div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Current Balance</div>
                    <div className={`mt-2 text-3xl font-bold ${data.summary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.summary.currentBalance >= 0 ? '+' : ''}৳{data.summary.currentBalance.toFixed(0)}
                    </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground">Expense Balance</div>
                    <div className={`mt-2 text-3xl font-bold ${data.summary.expenseBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {data.summary.expenseBalance >= 0 ? '+' : ''}৳{data.summary.expenseBalance.toFixed(0)}
                    </div>
                </div>
            </div>

            {/* Deposit History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Deposit History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.deposits.length === 0 ? (
                                <tr><td colSpan="2" className="p-4 text-center text-muted-foreground">No deposits found</td></tr>
                            ) : (
                                data.history.deposits.map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(deposit.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right font-medium">৳{deposit.amount.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Expense History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium text-right">Paid</th>
                                <th className="px-6 py-3 font-medium text-right">Share</th>
                                <th className="px-6 py-3 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.expenses.length === 0 ? (
                                <tr><td colSpan="5" className="p-4 text-center text-muted-foreground">No expenses found</td></tr>
                            ) : (
                                data.history.expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{expense.description}</td>
                                        <td className="px-6 py-4 text-right">৳{expense.memberPaid.toFixed(0)}</td>
                                        <td className="px-6 py-4 text-right">৳{expense.memberShare.toFixed(0)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${expense.memberBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {expense.memberBalance >= 0 ? '+' : ''}৳{expense.memberBalance.toFixed(0)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grocery History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Grocery History (Done By Me)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium">Note</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.groceries.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-muted-foreground">No groceries found</td></tr>
                            ) : (
                                data.history.groceries.map((grocery) => (
                                    <tr key={grocery._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(grocery.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{grocery.description}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{grocery.note}</td>
                                        <td className="px-6 py-4 text-right font-medium">৳{grocery.amount.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Meal History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Meal History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.meals.length === 0 ? (
                                <tr><td colSpan="2" className="p-4 text-center text-muted-foreground">No meals found</td></tr>
                            ) : (
                                data.history.meals.map((meal) => (
                                    <tr key={meal._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(meal.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right font-medium">{meal.count.toFixed(1)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function MemberProfilePage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <MemberProfileContent />
        </Suspense>
    );
}
