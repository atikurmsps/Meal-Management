'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, ShoppingCart, Wallet, Utensils, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect, memo } from 'react';
import ConfirmModal from './ConfirmModal';
import type { ConfirmModalProps } from '@/types';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Meal History', href: '/history/meals', icon: Utensils },
    { name: 'Grocery History', href: '/history/groceries', icon: ShoppingCart },
    { name: 'Expense History', href: '/history/expenses', icon: Receipt },
    { name: 'Deposit History', href: '/history/deposits', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

function SidebarComponent() {
    const pathname = usePathname();
    const [currentMonth, setCurrentMonth] = useState('');
    const [pendingMonth, setPendingMonth] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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

    return (
        <div className="flex h-full w-72 flex-col bg-white border-r border-border shadow-sm">
            {/* Header */}
            <div className="flex h-20 items-center justify-center border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">M</span>
                    </div>
                    <h1 className="text-xl font-semibold text-foreground">Meal Manager</h1>
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

            {/* Footer */}
            <div className="p-6 border-t border-border">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Bachelor House
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Meal Management System
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
        </div>
    );
}

export default memo(SidebarComponent);
