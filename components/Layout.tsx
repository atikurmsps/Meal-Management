'use client';

import { useState, useEffect, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AuthContext } from '@/components/AuthProvider';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Safely get auth context - it might not be available during initial render
    const authContext = useContext(AuthContext);
    const user = authContext?.user || null;
    
    // Don't show sidebar on login/signup pages or when not authenticated
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const shouldShowSidebar = !isAuthPage && user;

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sidebarOpen && window.innerWidth < 1024) {
                const target = e.target as HTMLElement;
                if (!target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
                    setSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    // For auth pages or when not authenticated, render without sidebar
    if (!shouldShowSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Mobile Menu Button - Only show on mobile */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mobile-menu-button fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    sidebar-container
                    fixed lg:static
                    inset-y-0 left-0 z-40
                    w-72
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    lg:translate-x-0
                    h-screen
                `}
            >
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-6">
                    {children}
                </div>
            </main>
        </div>
    );
}

