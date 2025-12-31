'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AddExpenseModal from '@/components/AddExpenseModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import { formatDate } from '@/lib/dateUtils';
import type { Expense, Member, ApiResponse } from '@/types';

export default function ExpenseHistoryPage() {
    const { user, permissions } = useAuth();
    
    // Helper function to check if user can manage this month
    const canManageThisMonth = (monthToCheck: string) => {
        if (!user) return false;
        if (user.role === 'super') return true;
        if (user.role === 'manager' && user.assignedMonths && user.assignedMonths.includes(monthToCheck)) return true;
        return false;
    };
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all expenses, then filter by current month for display
            const res = await fetch('/api/expenses');
            const data = await res.json();
            if (data.success && data.data) {
                // Filter by current month from settings for display
                const filteredExpenses = month 
                    ? data.data.filter((expense: Expense) => expense.month === month)
                    : data.data;
                setExpenses(filteredExpenses);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    }, [month]);

    const fetchMembers = useCallback(async () => {
        try {
            const res = await fetch('/api/members');
            const data = await res.json();
            if (data.success) {
                setMembers(data.data);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }, []);

    const fetchCurrentMonth = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success && data.data.currentMonth) {
                setMonth(data.data.currentMonth);
            } else {
                // Fallback to current month if settings not found
                setMonth(new Date().toISOString().slice(0, 7));
            }
        } catch (error) {
            console.error('Error fetching current month:', error);
            // Fallback to current month on error
            setMonth(new Date().toISOString().slice(0, 7));
        }
    }, []);

    useEffect(() => {
        fetchCurrentMonth();
        fetchMembers();
    }, [fetchCurrentMonth, fetchMembers]);

    useEffect(() => {
        if (month) {
            fetchExpenses();
        }
    }, [month, fetchExpenses]);

    const handleSave = async (expenseData: { paidBy: string; splitAmong: string[]; description: string; amount: number; date: string }) => {
        try {
            // Extract month from the date (YYYY-MM-DD -> YYYY-MM)
            const monthFromDate = expenseData.date.slice(0, 7);
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...expenseData, month: monthFromDate }),
            });

            setIsModalOpen(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/expenses?id=${id}`, {
                method: 'DELETE',
            });
            setDeleteConfirm({ isOpen: false, id: null });
            fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const openAddModal = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">Expense History</h1>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {month && canManageThisMonth(month) && (
                    <button
                        onClick={openAddModal}
                            className="flex items-center gap-2 rounded-md bg-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full sm:w-auto justify-center"
                    >
                        <Plus className="h-4 w-4" /> Add New
                    </button>
                    )}
                </div>
            </div>

            {/* Member Status Table */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold">
                        Member Expense Status - Total Expense: ৳{expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-sm sm:text-base">Member</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-sm sm:text-base">Paid</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-sm sm:text-base">Share</th>
                                <th className="px-3 sm:px-4 lg:px-6 py-3 font-medium text-right text-sm sm:text-base">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {members.map((member) => {
                                const paid = expenses
                                    .filter(exp => {
                                        if (!exp.paidBy) return false;
                                        const paidById = typeof exp.paidBy === 'object' && exp.paidBy !== null 
                                            ? (exp.paidBy as any)._id 
                                            : exp.paidBy;
                                        return paidById === member._id;
                                    })
                                    .reduce((sum, exp) => sum + exp.amount, 0);

                                const share = expenses
                                    .filter(exp => {
                                        if (!exp.splitAmong || exp.splitAmong.length === 0) return false;
                                        return exp.splitAmong.some((m: any) => {
                                            if (!m) return false;
                                            const memberId = typeof m === 'object' && m !== null ? m._id : m;
                                            return memberId === member._id;
                                        });
                                    })
                                    .reduce((sum, exp) => sum + (exp.amount / exp.splitAmong.length), 0);

                                const balance = paid - share;

                                return (
                                    <tr key={member._id} className="hover:bg-muted/10">
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base">{member.name}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base">৳{paid.toFixed(0)}</td>
                                        <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right text-sm sm:text-base">৳{share.toFixed(0)}</td>
                                        <td className={`px-3 sm:px-4 lg:px-6 py-3 sm:py-4 text-right font-bold text-sm sm:text-base ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {balance >= 0 ? '+' : ''}৳{balance.toFixed(0)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expense List */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                    <h2 className="text-lg sm:text-xl font-semibold">Expense List</h2>
                </div>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-border">
                    {loading ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : expenses.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No expenses found for this month.</div>
                    ) : (
                        expenses.map((expense) => (
                            <div key={expense._id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">{expense.description}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {formatDate(expense.date)} • Paid by: {typeof expense.paidBy === 'object' && expense.paidBy !== null ? (expense.paidBy as any).name : 'N/A'}
                                        </p>
                                        {expense.splitAmong && expense.splitAmong.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {expense.splitAmong.map((member: any, idx) => (
                                                    <span key={idx} className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                                        {typeof member === 'object' && member !== null ? member.name : 'Unknown'}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {expense.note && (
                                            <p className="text-sm text-muted-foreground mt-1">{expense.note}</p>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-medium text-foreground">৳{expense.amount.toFixed(0)}</p>
                                        {expense.splitAmong?.length > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                ৳{(expense.amount / expense.splitAmong.length).toFixed(0)}/person
                                            </p>
                                        )}
                                        {canManageThisMonth(month) && (
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: expense._id })}
                                                    className="rounded p-1 text-red-600 hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                <th className="px-4 lg:px-6 py-3 font-medium">Description</th>
                                <th className="px-4 lg:px-6 py-3 font-medium">Paid By</th>
                                <th className="px-4 lg:px-6 py-3 font-medium">Split Among</th>
                                <th className="px-4 lg:px-6 py-3 font-medium">Note</th>
                                <th className="px-4 lg:px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-4 lg:px-6 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No expenses found for this month.</td></tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-muted/10">
                                        <td className="px-4 lg:px-6 py-4">{formatDate(expense.date)}</td>
                                        <td className="px-4 lg:px-6 py-4 font-medium">{expense.description}</td>
                                        <td className="px-4 lg:px-6 py-4">{typeof expense.paidBy === 'object' && expense.paidBy !== null ? (expense.paidBy as any).name : 'N/A'}</td>
                                        <td className="px-4 lg:px-6 py-4 text-sm">
                                            {expense.splitAmong?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {expense.splitAmong.map((member: any, idx) => (
                                                        <span key={idx} className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                                            {typeof member === 'object' && member !== null ? member.name : 'Unknown'}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : 'All'}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-muted-foreground">{expense.note}</td>
                                        <td className="px-4 lg:px-6 py-4 text-right">
                                            <div className="font-medium">৳{expense.amount.toFixed(0)}</div>
                                            {expense.splitAmong?.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    ৳{(expense.amount / expense.splitAmong.length).toFixed(0)}/person
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4">
                                            {canManageThisMonth(month) && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: expense._id })}
                                                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                }}
                members={members}
                assignedMonths={user?.assignedMonths}
                onSave={handleSave}
                editData={editingExpense}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                title="Delete Expense"
                message="Are you sure you want to delete this expense entry? This action cannot be undone."
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
            />
        </div>
    );
}
