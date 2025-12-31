'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserPlus, Shield, Edit2, X } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import { formatMonth } from '@/lib/dateUtils';
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
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        phoneNumber: '',
        role: 'general' as 'general' | 'manager' | 'super',
        assignedMonth: '',
        password: '',
        isActive: true,
    });
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

        try {
            // Prepare user data - only include assignedMonth if role is manager
            const trimmedPhone = newUser.phoneNumber.trim();
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
                    // Check if we can find the existing user to show more details
                    const existingUser = users.find(u => u.phoneNumber.trim() === trimmedPhone);
                    if (existingUser) {
                        alert(`Phone number "${trimmedPhone}" is already registered.\n\nExisting user:\nName: ${existingUser.name}\nRole: ${existingUser.role}\n\nPlease use a different phone number or edit the existing user.`);
                    } else {
                        alert(`Phone number "${trimmedPhone}" is already registered. Please use a different phone number.`);
                    }
                } else {
                    alert(`Failed to add user: ${errorMessage}`);
                }
                return;
            }

            if (data.success) {
                setUsers([...users, data.data]);
                setNewUser({ name: '', phoneNumber: '', password: '', email: '', role: 'general', assignedMonth: '' });
                setShowAddUserModal(false);
            }
        } catch (error) {
            console.error('Error adding user:', error);
            alert(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            assignedMonth: user.assignedMonth || '',
            password: '',
            isActive: user.isActive,
        });
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        // Validate manager role has assigned month
        if (editForm.role === 'manager' && !editForm.assignedMonth) {
            alert('Managers must have an assigned month');
            return;
        }

        try {
            const updateData: any = {
                userId: editingUser._id,
                name: editForm.name.trim(),
                phoneNumber: editForm.phoneNumber.trim(),
                role: editForm.role,
                isActive: editForm.isActive,
            };

            if (!updateData.name || !updateData.phoneNumber) {
                alert('Name and phone number are required');
                return;
            }

            if (editForm.role === 'manager' && editForm.assignedMonth) {
                updateData.assignedMonth = editForm.assignedMonth;
            }

            // Only include password if it's provided
            if (editForm.password.trim() !== '') {
                if (editForm.password.length < 6) {
                    alert('Password must be at least 6 characters');
                    return;
                }
                updateData.password = editForm.password;
            }

            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.error || 'Failed to update user');
                return;
            }

            if (data.success) {
                setUsers(users.map(user => user._id === editingUser._id ? data.data : user));
                setEditingUser(null);
                setEditForm({ name: '', phoneNumber: '', role: 'general', assignedMonth: '', password: '', isActive: true });
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
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
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-semibold">Users & Members</h2>
                            <span className="text-sm text-muted-foreground">(All users are members)</span>
                        </div>
                        <button
                            onClick={() => setShowAddUserModal(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </button>
                    </div>

                <div className="space-y-2">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className={`flex items-center justify-between rounded-md border border-border bg-background p-3 ${!user.isActive ? 'opacity-60' : ''}`}
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
                                                {formatMonth(user.assignedMonth)}
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-center text-muted-foreground">No users/members found.</p>
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

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-primary">Add New User</h2>
                            <button 
                                onClick={() => {
                                    setShowAddUserModal(false);
                                    setNewUser({ name: '', phoneNumber: '', password: '', email: '', role: 'general', assignedMonth: '' });
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={newUser.phoneNumber}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Email (optional)</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Password *</label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                    minLength={6}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="general">General User</option>
                                    <option value="manager">Manager</option>
                                    <option value="super">Super User</option>
                                </select>
                            </div>

                            {newUser.role === 'manager' && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned Month *</label>
                                    <input
                                        type="month"
                                        value={newUser.assignedMonth}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, assignedMonth: e.target.value }))}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddUserModal(false);
                                        setNewUser({ name: '', phoneNumber: '', password: '', email: '', role: 'general', assignedMonth: '' });
                                    }}
                                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Add User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-primary">Edit User</h2>
                            <button 
                                onClick={() => {
                                    setEditingUser(null);
                                    setEditForm({ name: '', phoneNumber: '', role: 'general', assignedMonth: '', password: '', isActive: true });
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={editForm.phoneNumber}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="general">General User</option>
                                    <option value="manager">Manager</option>
                                    <option value="super">Super User</option>
                                </select>
                            </div>

                            {editForm.role === 'manager' && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Assigned Month</label>
                                    <input
                                        type="month"
                                        value={editForm.assignedMonth}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, assignedMonth: e.target.value }))}
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    New Password (leave empty to keep current)
                                </label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Enter new password"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    minLength={6}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">Minimum 6 characters</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                        className="rounded border-input"
                                    />
                                    <span className="text-sm font-medium text-foreground">Active</span>
                                </label>
                                <p className="mt-1 text-xs text-muted-foreground">Inactive users cannot log in</p>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingUser(null);
                                        setEditForm({ name: '', phoneNumber: '', role: 'general', assignedMonth: '', password: '', isActive: true });
                                    }}
                                    className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
