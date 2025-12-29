'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';

function MemberProfileContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const memberId = params?.memberId;
    const [month, setMonth] = useState(searchParams?.get?.('month') || new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debug logging
    useEffect(() => {
        console.log('MemberProfileContent mounted');
        console.log('params:', params);
        console.log('memberId:', memberId);
        console.log('searchParams:', searchParams?.toString());
    }, [params, memberId, searchParams]);

    const fetchData = useCallback(async () => {
        console.log('MemberProfileContent - memberId:', memberId);
        console.log('MemberProfileContent - params:', params);

        if (!memberId) {
            setError('Member ID not found in URL');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const url = `/api/user/${memberId}?month=${month}`;
            console.log('Fetching from URL:', url);

            const res = await fetch(url);
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
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-lg">
                                {data.member.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">{data.member.name}'s Profile</h1>
                            <p className="text-muted-foreground">Member overview for {month}</p>
                        </div>
                    </div>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:ring-0"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Deposit</p>
                        <p className="text-3xl font-bold text-foreground">{data.summary.totalDeposit.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Grocery</p>
                        <p className="text-3xl font-bold text-foreground">{data.summary.totalGrocery.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Meals</p>
                        <p className="text-3xl font-bold text-foreground">{data.summary.totalMeals.toFixed(1)}</p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Total Meal Bill</p>
                        <p className="text-3xl font-bold text-foreground">{data.summary.totalMealBill.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Current Balance</p>
                        <p className={`text-3xl font-bold ${data.summary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.summary.currentBalance >= 0 ? '+' : ''}{data.summary.currentBalance.toFixed(0)}
                        </p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground mb-2">Expense Balance</p>
                        <p className={`text-3xl font-bold ${data.summary.expenseBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.summary.expenseBalance >= 0 ? '+' : ''}{data.summary.expenseBalance.toFixed(0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Deposit History */}
            <div className="card overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-success" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Deposit History</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.deposits.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="px-6 py-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">💰</span>
                                            <span>No deposits found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.history.deposits.map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-muted/20 transition-colors duration-150">
                                        <td className="px-6 py-4 text-sm text-foreground">{new Date(deposit.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium text-success">+৳{deposit.amount.toFixed(0)}</td>
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

function MemberProfilePageInner() {
    return <MemberProfileContent />;
}

export default function MemberProfilePage() {
    return <MemberProfileContent />;
}
