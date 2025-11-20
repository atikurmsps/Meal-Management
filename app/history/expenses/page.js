'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ExpenseHistoryPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expenses?month=${month}`);
            const data = await res.json();
            if (data.success) {
                setExpenses(data.data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Expense History</h1>
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
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
                            {loading ? (
                                <tr><td colSpan="4" className="p-4 text-center">Loading...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="4" className="p-4 text-center text-muted-foreground">No expenses found for this month.</td></tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{expense.description}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{expense.note}</td>
                                        <td className="px-6 py-4 text-right font-medium">৳{expense.amount.toFixed(0)}</td>
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
