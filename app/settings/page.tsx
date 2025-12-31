'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserPlus, Shield } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import type { Member, User, ApiResponse } from '@/types';

export default function SettingsPage() {
    const { user, permissions } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ 
        name: '', 
        phoneNumber: '', 
        password: '', 
        email: '',
        role: 'general' as 'general' | 'manager' | 'super', 
        assignedMonth: '' 
    });
    const [currentMonth, setCurrentMonth] = useState<string>('');
    const [pendingMonth, setPendingMonth] = useState<string>('');
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const promises = [
                fetch('/api/settings')
            ];

            // Fetch users (all users are members)
            if (permissions.canManageMembers) {
                promises.push(fetch('/api/users'));
            }

            const [settingsRes, usersRes] = await Promise.all(promises);
            const settingsData = await settingsRes.json();

            if (settingsData.success) setCurrentMonth(settingsData.data.currentMonth);

            if (usersRes) {
                const usersData = await usersRes.json();
                if (usersData.success) setUsers(usersData.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // User management functions
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUser.name.trim() || !newUser.phoneNumber.trim() || !newUser.password.trim()) return;

        // Validate manager role has assigned month
        if (newUser.role === 'manager' && !newUser.assignedMonth) {
            alert('Managers must have an assigned month');
            return;
        }

        // Check if phone number already exists
        const trimmedPhone = newUser.phoneNumber.trim();
        const existingUser = users.find(u => u.phoneNumber.trim() === trimmedPhone);
        if (existingUser) {
            const message = `A user with phone number "${trimmedPhone}" already exists.\n\nName: ${existingUser.name}\nRole: ${existingUser.role}\n\nPlease use a different phone number or edit the existing user.`;
            alert(message);
            return;
        }

        try {
            // Prepare user data - only include assignedMonth if role is manager
            const userData: any = {
                name: newUser.name.trim(),
                phoneNumber: trimmedPhone,
                password: newUser.password,
                role: newUser.role,
            };

            if (newUser.email && newUser.email.trim()) {
                userData.email = newUser.email.trim();
            }

            if (newUser.role === 'manager' && newUser.assignedMonth) {
                userData.assignedMonth = newUser.assignedMonth;
            }

            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                const errorMessage = data.error || `API failed: ${res.status} ${res.statusText}`;
                
                // Provide more helpful error messages
                if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
                    alert(`Phone number "${trimmedPhone}" is already registered. Please use a different phone number or check the existing users list.`);
                } else {
                    alert(`Failed to add user: ${errorMessage}`);
                }
                return;
            }

            if (data.success) {
                setUsers([...users, data.data]);
                setNewUser({ name: '', phoneNumber: '', password: '', email: '', role: 'general', assignedMonth: '' });
            }
        } catch (error) {
            console.error('Error adding user:', error);
            alert(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleUpdateUserRole = async (userId: string, role: string, assignedMonth?: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role, assignedMonth }),
            });
            const data = await res.json();
            if (data.success) {
                setUsers(users.map(user => user._id === userId ? data.data : user));
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
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

            {/* User & Member Management - All users are members */}
            {permissions.canManageMembers ? (
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Users & Members</h2>
                        <span className="text-sm text-muted-foreground">(All users are members)</span>
                    </div>

                    <form onSubmit={handleAddUser} className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Full Name *"
                            value={newUser.name}
                            onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number *"
                            value={newUser.phoneNumber}
                            onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email (optional)"
                            value={newUser.email}
                            onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                        <input
                            type="password"
                            placeholder="Password *"
                            value={newUser.password}
                            onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                            minLength={6}
                        />
                        <select
                            value={newUser.role}
                            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            <option value="general">General User</option>
                            <option value="manager">Manager</option>
                            <option value="super">Super User</option>
                        </select>
                        {newUser.role === 'manager' && (
                            <input
                                type="month"
                                placeholder="Assigned Month *"
                                value={newUser.assignedMonth}
                                onChange={(e) => setNewUser(prev => ({ ...prev, assignedMonth: e.target.value }))}
                                className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                required
                            />
                        )}
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 md:col-span-2 lg:col-span-1"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User/Member
                        </button>
                    </form>

                    <div className="space-y-2">
                        {users.filter(u => u.isActive).map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex-1">
                                        <p className="font-medium">{user.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span>{user.phoneNumber}</span>
                                            {user.email && <span>• {user.email}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            user.role === 'super' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {user.role === 'super' ? 'Super User' :
                                             user.role === 'manager' ? 'Manager' : 'General User'}
                                        </span>
                                        {user.role === 'manager' && user.assignedMonth && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                                {user.assignedMonth}
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {users.filter(u => u.isActive).length === 0 && (
                            <p className="text-center text-muted-foreground">No active users/members found.</p>
                        )}
                    </div>
                </section>
            ) : (
                <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Members</h2>
                    </div>
                    <div className="space-y-2">
                        {users.filter(u => u.isActive).map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center justify-between rounded-md border border-border bg-background p-3"
                            >
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        ))}
                        {users.filter(u => u.isActive).length === 0 && (
                            <p className="text-center text-muted-foreground">No members found.</p>
                        )}
                    </div>
                </section>
            )}

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
