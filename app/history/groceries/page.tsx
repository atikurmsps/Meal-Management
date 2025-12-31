'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import AddGroceryModal from '@/components/AddGroceryModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import type { Grocery, Member, ApiResponse } from '@/types';

export default function GroceryHistoryPage() {
    const { user, permissions } = useAuth();
    
    // Helper function to check if user can manage this month
    const canManageThisMonth = (monthToCheck: string) => {
        if (!user) return false;
        if (user.role === 'super') return true;
        if (user.role === 'manager' && user.assignedMonth === monthToCheck) return true;
        return false;
    };
    const [groceries, setGroceries] = useState<Grocery[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingGrocery, setEditingGrocery] = useState<Grocery | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const fetchGroceries = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all groceries, then filter by current month for display
            const res = await fetch('/api/groceries');
            const data = await res.json();
            if (data.success && data.data) {
                // Filter by current month from settings for display
                const filteredGroceries = month 
                    ? data.data.filter((grocery: Grocery) => grocery.month === month)
                    : data.data;
                setGroceries(filteredGroceries);
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
            fetchGroceries();
        }
    }, [month, fetchGroceries]);

    const handleSave = async (groceryData: { doneBy: string; description: string; amount: number; note?: string; date: string }) => {
        try {
            // Extract month from the date (YYYY-MM-DD -> YYYY-MM)
            const monthFromDate = groceryData.date.slice(0, 7);
            await fetch('/api/groceries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...groceryData, month: monthFromDate }),
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
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">Grocery History</h1>
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

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-border">
                    {loading ? (
                        <div className="p-4 text-center">Loading...</div>
                    ) : groceries.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">No groceries found for this month.</div>
                    ) : (
                        groceries.map((grocery) => (
                            <div key={grocery._id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">{grocery.description}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {new Date(grocery.date).toLocaleDateString()} • {typeof grocery.doneBy === 'object' && grocery.doneBy !== null ? (grocery.doneBy as any).name : '-'}
                                        </p>
                                        {grocery.note && (
                                            <p className="text-sm text-muted-foreground mt-1">{grocery.note}</p>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <p className="font-medium text-foreground">৳{grocery.amount.toFixed(0)}</p>
                                        {canManageThisMonth(month) && (
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => handleEdit(grocery)}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({ isOpen: true, id: grocery._id })}
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
                                <th className="px-4 lg:px-6 py-3 font-medium">Done By</th>
                                <th className="px-4 lg:px-6 py-3 font-medium">Note</th>
                                <th className="px-4 lg:px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-4 lg:px-6 py-3 font-medium text-center">Actions</th>
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
                                        <td className="px-4 lg:px-6 py-4">{new Date(grocery.date).toLocaleDateString()}</td>
                                        <td className="px-4 lg:px-6 py-4 font-medium">{grocery.description}</td>
                                        <td className="px-4 lg:px-6 py-4">{typeof grocery.doneBy === 'object' && grocery.doneBy !== null ? (grocery.doneBy as any).name : '-'}</td>
                                        <td className="px-4 lg:px-6 py-4 text-muted-foreground">{grocery.note}</td>
                                        <td className="px-4 lg:px-6 py-4 text-right font-medium">৳{grocery.amount.toFixed(0)}</td>
                                        <td className="px-4 lg:px-6 py-4">
                                            {canManageThisMonth(month) && (
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
                                            )}
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
                assignedMonth={user?.assignedMonth}
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
