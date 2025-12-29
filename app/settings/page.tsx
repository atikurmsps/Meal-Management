'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import type { Member, ApiResponse } from '@/types';

export default function SettingsPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [newMemberName, setNewMemberName] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<string>('');
    const [pendingMonth, setPendingMonth] = useState<string>('');
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [membersRes, settingsRes] = await Promise.all([
                fetch('/api/members'),
                fetch('/api/settings')
            ]);
            const membersData = await membersRes.json();
            const settingsData = await settingsRes.json();

            if (membersData.success) setMembers(membersData.data);
            if (settingsData.success) setCurrentMonth(settingsData.data.currentMonth);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberName.trim()) return;

        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newMemberName }),
            });
            const data = await res.json();
            if (data.success) {
                setMembers([...members, data.data]);
                setNewMemberName('');
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleMonthChange = (e) => {
        const newMonth = e.target.value;
        setPendingMonth(newMonth);
        setShowConfirmModal(true);
    };

    const confirmMonthChange = async () => {
        setCurrentMonth(pendingMonth);
        setShowConfirmModal(false);

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentMonth: pendingMonth }),
            });
            // Reload to refresh all data
            window.location.reload();
        } catch (error) {
            console.error('Error updating month:', error);
        }
    };

    const cancelMonthChange = () => {
        setShowConfirmModal(false);
        setPendingMonth('');
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-primary">Settings</h1>

            {/* Month Selection */}
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">General Settings</h2>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground">Current Month</label>
                    <input
                        type="month"
                        value={currentMonth}
                        onChange={handleMonthChange}
                        className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                        This month will be used for the dashboard calculations.
                    </p>
                </div>
            </section>

            {/* Member Management */}
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Members</h2>

                <form onSubmit={handleAddMember} className="mb-6 flex gap-2">
                    <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Enter member name"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" /> Add Member
                    </button>
                </form>

                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member._id}
                            className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                        >
                            <span className="font-medium">{member.name}</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${member.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {member.active ? 'Active' : 'Inactive'}
                                </span>
                                {/* Add delete/deactivate functionality if needed */}
                            </div>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <p className="text-center text-muted-foreground">No members added yet.</p>
                    )}
                </div>
            </section>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={cancelMonthChange}
                onConfirm={confirmMonthChange}
                title="Switch Month"
                message={`Are you sure you want to switch to ${pendingMonth}?\n\nThis will change the active month for all data and reload the page.`}
            />
        </div>
    );
}
