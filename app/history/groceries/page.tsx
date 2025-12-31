'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AddGroceryModal from '@/components/AddGroceryModal';
import ConfirmModal from '@/components/ConfirmModal';
import type { Grocery, Member, ApiResponse } from '@/types';

export default function GroceryHistoryPage() {
    const [groceries, setGroceries] = useState<Grocery[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const fetchGroceries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/groceries?month=${month}`);
            const data = await res.json();
            if (data.success) {
                setGroceries(data.data);
            }
        } catch (error) {
            console.error('Error fetching groceries:', error);
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
        fetchGroceries();
        fetchMembers();
    }, [fetchGroceries, fetchMembers]);

    const handleSave = async (groceryData: { doneBy: string; description: string; amount: number; note?: string; date: string }) => {
        try {
            await fetch('/api/groceries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...groceryData, month }),
            });

            setIsModalOpen(false);
            setEditingGrocery(null);
            fetchGroceries();
        } catch (error) {
            console.error('Error saving grocery:', error);
        }
    };

    const handleEdit = (grocery: Grocery) => {
        setEditingGrocery(grocery);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/groceries?id=${id}`, {
                method: 'DELETE',
            });
            setDeleteConfirm({ isOpen: false, id: null });
            fetchGroceries();
        } catch (error) {
            console.error('Error deleting grocery:', error);
        }
    };

    const openAddModal = () => {
        setEditingGrocery(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Grocery History</h1>
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
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium">Done By</th>
                                <th className="px-6 py-3 font-medium">Note</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                            ) : groceries.length === 0 ? (
                                <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No groceries found for this month.</td></tr>
                            ) : (
                                groceries.map((grocery) => (
                                    <tr key={grocery._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(grocery.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{grocery.description}</td>
                                        <td className="px-6 py-4">{typeof grocery.doneBy === 'object' && grocery.doneBy !== null ? (grocery.doneBy as any).name : '-'}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{grocery.note}</td>
                                        <td className="px-6 py-4 text-right font-medium">৳{grocery.amount.toFixed(0)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(grocery)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: grocery._id })}
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

            <AddGroceryModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingGrocery(null);
                }}
                onSave={handleSave}
                members={members}
                editData={editingGrocery}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                title="Delete Grocery"
                message="Are you sure you want to delete this grocery entry? This action cannot be undone."
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
            />
        </div>
    );
}
