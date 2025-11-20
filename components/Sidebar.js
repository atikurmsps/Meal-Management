'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, ShoppingCart, Wallet, Utensils, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Meal History', href: '/history/meals', icon: Utensils },
    { name: 'Grocery History', href: '/history/groceries', icon: ShoppingCart },
    { name: 'Expense History', href: '/history/expenses', icon: Receipt },
    { name: 'Deposit History', href: '/history/deposits', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
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
        <div className="flex h-full w-64 flex-col bg-primary text-primary-foreground shadow-xl">
            <div className="flex h-16 items-center justify-center border-b border-primary-foreground/20">
                <h1 className="text-2xl font-bold tracking-wider">Meal Mgr</h1>
            </div>

            {/* Month Selector */}
            <div className="border-b border-primary-foreground/20 p-4">
                <label className="block text-xs font-medium opacity-70 mb-2">Current Month</label>
                <input
                    type="month"
                    value={currentMonth}
                    onChange={handleMonthChange}
                    className="w-full rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-2 text-sm text-primary-foreground focus:border-primary-foreground/50 focus:ring-1 focus:ring-primary-foreground/50"
                />
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors hover:bg-primary-foreground/10',
                                pathname === item.href ? 'bg-primary-foreground/20 font-semibold' : ''
                            )}
                        >
                            <Icon className="h-6 w-6" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 text-center text-sm opacity-70">
                &copy; {new Date().getFullYear()} Bachelor House
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
