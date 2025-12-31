'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Settings, ShoppingCart, Wallet, Utensils, Receipt, LogOut, User, ChevronDown, Eye, EyeOff, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect, memo } from 'react';
import ConfirmModal from './ConfirmModal';
import { useAuth } from '@/components/AuthProvider';
import type { ConfirmModalProps } from '@/types';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Meal History', href: '/history/meals', icon: Utensils },
    { name: 'Grocery History', href: '/history/groceries', icon: ShoppingCart },
    { name: 'Expense History', href: '/history/expenses', icon: Receipt },
    { name: 'Deposit History', href: '/history/deposits', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

function SidebarComponent({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, permissions } = useAuth();
    const [currentMonth, setCurrentMonth] = useState('');
    const [pendingMonth, setPendingMonth] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success) {
                    setCurrentMonth(data.data.currentMonth);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

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
            // Reload the page to refresh data
            window.location.reload();
        } catch (error) {
            console.error('Error updating month:', error);
        }
    };

    const cancelMonthChange = () => {
        setShowConfirmModal(false);
        setPendingMonth('');
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
            });
            // Use window.location for a hard redirect to ensure full page reload
            // This will trigger AuthProvider to refresh auth state on the login page
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, redirect to login
            window.location.href = '/login';
        }
    };

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'super': return 'Super User';
            case 'manager': return 'Manager';
            case 'general': return 'General User';
            default: return role;
        }
    };

    return (
        <div className="flex h-full w-full lg:w-72 flex-col bg-white border-r border-border shadow-sm">
            {/* Header */}
            <div className="flex h-20 items-center justify-center border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex w-8 h-8 bg-primary rounded-lg items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">M</span>
                    </div>
                    <h1 className="hidden lg:block text-xl font-semibold text-foreground">Meal Manager</h1>
                </div>
            </div>

            {/* Month Selector */}
            <div className="p-6 border-b border-border">
                <label className="block text-sm font-medium text-foreground mb-3">Current Month</label>
                <input
                    type="month"
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                                // Close sidebar on mobile when navigating
                                if (window.innerWidth < 1024 && onClose) {
                                    onClose();
                                }
                            }}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <Icon className={clsx(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span>{item.name}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 bg-primary-foreground rounded-full"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-border">
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-foreground truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {getRoleDisplay(user?.role || '')}
                            </p>
                        </div>
                        <ChevronDown className={clsx(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            showUserMenu && "rotate-180"
                        )} />
                    </button>

                    {/* User Menu */}
                    {showUserMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                            <button
                                onClick={() => {
                                    setShowPasswordModal(true);
                                    setShowUserMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setShowUserMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Bachelor House
                    </p>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={cancelMonthChange}
                onConfirm={confirmMonthChange}
                title="Switch Month"
                message={`Are you sure you want to switch to ${pendingMonth}?\n\nThis will change the active month for all data and reload the page.`}
            />

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </div>
    );
}

function ChangePasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Password changed successfully!');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setTimeout(() => {
                    onClose();
                    setSuccess('');
                }, 2000);
            } else {
                setError(data.error || 'Failed to change password');
            }
        } catch (error) {
            setError('An error occurred while changing password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg border border-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Change Password</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-success/10 text-success px-3 py-2 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                required
                                value={formData.currentPassword}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full pl-10 pr-12 py-3 border border-input rounded-lg bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default memo(SidebarComponent);
