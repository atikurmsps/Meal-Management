'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';
import { formatMonth, formatDate } from '@/lib/dateUtils';
import type { MemberProfileData, ApiResponse } from '@/types';

function MemberProfileContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const memberId = params?.memberId as string;
    const [month, setMonth] = useState<string>(searchParams?.get?.('month') || new Date().toISOString().slice(0, 7));
    const [data, setData] = useState<MemberProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!memberId) {
            setError('Member ID not found in URL');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const url = `/api/user/${memberId}?month=${month}`;
            const res = await fetch(url);
            const result: ApiResponse<MemberProfileData> = await res.json();

            if (result.success && result.data) {
                setData(result.data);
            } else {
                setError(result.error || 'Failed to load member data');
            }
        } catch (error) {
            console.error('Error fetching member data:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while fetching member data');
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
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <Link href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-base sm:text-lg">
                                {data.member.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight truncate">{data.member.name}'s Profile</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">Member overview for {formatMonth(month)}</p>
                        </div>
                    </div>
                </div>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-foreground focus:border-primary focus:ring-0 w-full sm:w-auto"
                />
            </div>

            {/* Summary Cards - 2 columns on mobile */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Deposit</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">৳{data.summary.totalDeposit.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Grocery</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">৳{data.summary.totalGrocery.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Meals</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{data.summary.totalMeals.toFixed(1)}</p>
                    </div>
                </div>

                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Meal Bill</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">৳{data.summary.totalMealBill.toFixed(0)}</p>
                    </div>
                </div>

                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Current Balance</p>
                        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${data.summary.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.summary.currentBalance >= 0 ? '+' : ''}৳{data.summary.currentBalance.toFixed(0)}
                        </p>
                    </div>
                </div>

                <div className="card p-4 sm:p-6">
                    <div className="text-center">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Expense Balance</p>
                        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${data.summary.expenseBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {data.summary.expenseBalance >= 0 ? '+' : ''}৳{data.summary.expenseBalance.toFixed(0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Deposit History */}
            <div className="card overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-success" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Deposit History</h2>
                    </div>
                </div>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-border">
                    {data.history.deposits.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl">💰</span>
                                <span>No deposits found</span>
                            </div>
                        </div>
                    ) : (
                        data.history.deposits.map((deposit) => (
                            <div key={deposit._id} className="p-4 flex items-center justify-between">
                                <p className="text-sm text-foreground">{formatDate(deposit.date)}</p>
                                <p className="text-sm font-medium text-success">+৳{deposit.amount.toFixed(0)}</p>
                            </div>
                        ))
                    )}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-4 lg:px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date</th>
                                <th className="px-4 lg:px-6 py-4 text-right text-sm font-semibold text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.deposits.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-2xl">💰</span>
                                            <span>No deposits found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.history.deposits.map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-muted/20 transition-colors duration-150">
                                        <td className="px-4 lg:px-6 py-4 text-sm text-foreground">{formatDate(deposit.date)}</td>
                                        <td className="px-4 lg:px-6 py-4 text-right text-sm font-medium text-success">+৳{deposit.amount.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold">Expense History</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-xs sm:text-sm">Date</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-xs sm:text-sm">Description</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-xs sm:text-sm">Paid</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-xs sm:text-sm">Share</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-xs sm:text-sm">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.expenses.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-sm">No expenses found</td></tr>
                            ) : (
                                data.history.expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-muted/10">
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">{formatDate(expense.date)}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm">{expense.description}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">৳{expense.memberPaid.toFixed(0)}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm">৳{expense.memberShare.toFixed(0)}</td>
                                        <td className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right font-bold text-xs sm:text-sm ${expense.memberBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold">Grocery History (Done By Me)</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-xs sm:text-sm">Date</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-xs sm:text-sm">Description</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-xs sm:text-sm">Note</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-xs sm:text-sm">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.groceries.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-sm">No groceries found</td></tr>
                            ) : (
                                data.history.groceries.map((grocery) => (
                                    <tr key={grocery._id} className="hover:bg-muted/10">
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">{formatDate(grocery.date)}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm">{grocery.description}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-muted-foreground text-xs sm:text-sm">{grocery.note || '-'}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right font-medium text-xs sm:text-sm">৳{grocery.amount.toFixed(0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Meal History */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold">Meal History</h2>
                </div>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-border">
                    {data.history.meals.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No meals found</div>
                    ) : (
                        data.history.meals.map((meal) => (
                            <div key={meal._id} className="p-4 flex items-center justify-between">
                                <p className="text-sm text-foreground">{formatDate(meal.date)}</p>
                                <p className="text-sm font-medium text-foreground">{meal.count.toFixed(1)}</p>
                            </div>
                        ))
                    )}
                </div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 lg:px-6 py-3 font-medium">Date</th>
                                <th className="px-4 lg:px-6 py-3 font-medium text-right">Count</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {data.history.meals.length === 0 ? (
                                <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No meals found</td></tr>
                            ) : (
                                data.history.meals.map((meal) => (
                                    <tr key={meal._id} className="hover:bg-muted/10">
                                        <td className="px-4 lg:px-6 py-4">{formatDate(meal.date)}</td>
                                        <td className="px-4 lg:px-6 py-4 text-right font-medium">{meal.count.toFixed(1)}</td>
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
