'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, ShoppingCart, Wallet, Utensils } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Meal History', href: '/history/meals', icon: Utensils },
    { name: 'Expense History', href: '/history/expenses', icon: ShoppingCart },
    { name: 'Deposit History', href: '/history/deposits', icon: Wallet },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-primary text-primary-foreground shadow-xl">
            <div className="flex h-16 items-center justify-center border-b border-primary-foreground/20">
                <h1 className="text-2xl font-bold tracking-wider">Meal Mgr</h1>
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
        </div>
    );
}
