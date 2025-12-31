'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import AddMealModal from '@/components/AddMealModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import type { Meal, Member, ApiResponse } from '@/types';

export default function MealHistoryPage() {
    const { user, permissions } = useAuth();
    
    // Helper function to check if user can manage this month
    const canManageThisMonth = (monthToCheck: string) => {
        if (!user) return false;
        if (user.role === 'super') return true;
        if (user.role === 'manager' && user.assignedMonth === monthToCheck) return true;
        return false;
    };
    const [meals, setMeals] = useState<Meal[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [month, setMonth] = useState<string>('');
    const [selectedMember, setSelectedMember] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const fetchMeals = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all meals, then filter by selected member if needed
            // The month filter is removed so we show all entries regardless of their month
            const url = selectedMember
                ? `/api/meals?memberId=${selectedMember}`
                : `/api/meals`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                // Filter by current month from settings for display
                const filteredMeals = month 
                    ? data.data.filter((meal: Meal) => meal.month === month)
                    : data.data;
                setMeals(filteredMeals);
            }
        } catch (error) {
            console.error('Error fetching meals:', error);
        } finally {
            setLoading(false);
        }
    }, [month, selectedMember]);

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
            fetchMeals();
        }
    }, [month, fetchMeals]);

    const handleSaveMeal = async (mealData: { date: string; meals: { memberId: string; count: number }[] }) => {
        try {
            // Extract month from the date (YYYY-MM-DD -> YYYY-MM)
            const monthFromDate = mealData.date.slice(0, 7);
            await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...mealData, month: monthFromDate }),
            });
            setIsModalOpen(false);
            fetchMeals();
        } catch (error) {
            console.error('Error saving meal:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/meals?id=${id}`, {
                method: 'DELETE',
            });
            setDeleteConfirm({ isOpen: false, id: null });
            fetchMeals();
        } catch (error) {
            console.error('Error deleting meal:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-primary">Meal History</h1>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                        <option value="">All Members</option>
                        {members.map((member) => (
                            <option key={member._id} value={member._id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                    {month && canManageThisMonth(month) && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4" /> Add New
                        </button>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Member</th>
                                <th className="px-6 py-3 font-medium text-right">Count</th>
                                <th className="px-6 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>
                            ) : meals.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No meals found for this month.</td></tr>
                            ) : (
                                meals.map((meal) => (
                                    <tr key={meal._id} className="hover:bg-muted/10">
                                        <td className="px-6 py-4">{new Date(meal.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium">{typeof meal.memberId === 'object' && meal.memberId !== null ? (meal.memberId as any).name : 'Unknown'}</td>
                                        <td className="px-6 py-4 text-right font-medium">{meal.count}</td>
                                        <td className="px-6 py-4">
                                            {canManageThisMonth(month) && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setDeleteConfirm({ isOpen: true, id: meal._id })}
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

            <AddMealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                members={members}
                assignedMonth={user?.assignedMonth}
                onSave={handleSaveMeal}
            />

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
                title="Delete Meal"
                message="Are you sure you want to delete this meal entry? This action cannot be undone."
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
            />
        </div>
    );
}
