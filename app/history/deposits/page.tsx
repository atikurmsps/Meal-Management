'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AddDepositModal from '@/components/AddDepositModal';
import ConfirmModal from '@/components/ConfirmModal';
import type { Deposit, Member, ApiResponse } from '@/types';

export default function DepositHistoryPage() {
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const fetchDeposits = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/deposits?month=${month}`);
            const data: ApiResponse<Deposit[]> = await res.json();
            if (data.success && data.data) {
                setDeposits(data.data);
            }
        } catch (error) {
            console.error('Error fetching deposits:', error);
        } finally {
            setLoading(false);
        }
    }, [month]);

    const fetchMembers = useCallback(async () => {
        try {
            const res = await fetch('/api/members');
            const data: ApiResponse<Member[]> = await res.json();
            if (data.success && data.data) {
                setMembers(data.data);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        }
    }, []);

    useEffect(() => {
        fetchDeposits();
        fetchMembers();
    }, [fetchDeposits, fetchMembers]);

    const handleSave = async (depositData: { memberId: string; amount: number; date: string }) => {
        try {
            await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...depositData, month }),
            });

            setIsModalOpen(false);
            setEditingDeposit(null);
            fetchDeposits();
        } catch (error) {
            console.error('Error saving deposit:', error);
        }
    };

    const handleEdit = (deposit: Deposit) => {
        setEditingDeposit(deposit);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/deposits?id=${id}`, {
                method: 'DELETE',
            });
            setDeleteConfirm({ isOpen: false, id: null });
            fetchDeposits();
        } catch (error) {
            console.error('Error deleting deposit:', error);
        }
    };

    const openAddModal = () => {
        setEditingDeposit(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Deposit History</h1>
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

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                            ) : deposits.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No deposits found for this month.</td></tr>
                            ) : (
                                deposits.map((deposit) => (
                                    <tr key={deposit._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(deposit.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{typeof deposit.memberId === 'object' && deposit.memberId !== null ? (deposit.memberId as any).name : 'N/A'}</td>
                                        <td className="px-6 py-4 text-right font-medium">৳{deposit.amount.toFixed(0)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(deposit)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: deposit._id })}
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

            <AddDepositModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingDeposit(null);
                }}
                members={members}
                onSave={handleSave}
                editData={editingDeposit}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                title="Delete Deposit"
                message="Are you sure you want to delete this deposit entry? This action cannot be undone."
            />
        </div>
    );
}
