'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AddExpenseModal from '@/components/AddExpenseModal';
import ConfirmModal from '@/components/ConfirmModal';
import type { Expense, Member, ApiResponse } from '@/types';

export default function ExpenseHistoryPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

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

    useEffect(() => {
        fetchExpenses();
        fetchMembers();
    }, [fetchExpenses, fetchMembers]);

    const handleSave = async (expenseData: { paidBy: string; splitAmong: string[]; description: string; amount: number; date: string }) => {
        try {
            await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...expenseData, month }),
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

    const handleDelete = async (id) => {
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Expense History</h1>
                <div className="flex items-center gap-3">
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> Add New
                    </button>
                </div>
            </div>

            {/* Member Status Table */}
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">
                        Member Expense Status - Total Expense: ৳{expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(0)}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-right">Paid</th>
                                <th className="px-6 py-3 font-medium text-right">Share</th>
                                <th className="px-6 py-3 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {members.map((member) => {
                                const paid = expenses
                                    .filter(exp => exp.paidBy?._id === member._id)
                                    .reduce((sum, exp) => sum + exp.amount, 0);

                                const share = expenses
                                    .filter(exp => exp.splitAmong?.some(m => m._id === member._id))
                                    .reduce((sum, exp) => sum + (exp.amount / exp.splitAmong.length), 0);

                                const balance = paid - share;

                                return (
                                    <tr key={member._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4 font-medium">{member.name}</td>
                                        <td className="px-6 py-4 text-right">৳{paid.toFixed(0)}</td>
                                        <td className="px-6 py-4 text-right">৳{share.toFixed(0)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Expense List</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium">Paid By</th>
                                <th className="px-6 py-3 font-medium">Split Among</th>
                                <th className="px-6 py-3 font-medium">Note</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="7" className="p-4 text-center text-muted-foreground">No expenses found for this month.</td></tr>
                            ) : (
                                expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{expense.description}</td>
                                        <td className="px-6 py-4">{expense.paidBy?.name || 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {expense.splitAmong?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {expense.splitAmong.map((member, idx) => (
                                                        <span key={idx} className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                                            {member.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : 'All'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{expense.note}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-medium">৳{expense.amount.toFixed(0)}</div>
                                            {expense.splitAmong?.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    ৳{(expense.amount / expense.splitAmong.length).toFixed(0)}/person
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
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
                onSave={handleSave}
                editData={editingExpense}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Expense"
                message="Are you sure you want to delete this expense entry? This action cannot be undone."
                onConfirm={() => handleDelete(deleteConfirm.id)}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
            />
        </div>
    );
}
