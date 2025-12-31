'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatMonth } from '@/lib/dateUtils';
import type { AddMealModalProps, Member } from '@/types';

export default function AddMealModal({ isOpen, onClose, members, assignedMonths, onSave }: AddMealModalProps) {
    // For managers, set initial date to first day of first assigned month, otherwise use today
    const getInitialDate = () => {
        if (assignedMonths && assignedMonths.length > 0) {
            const sortedMonths = [...assignedMonths].sort();
            return `${sortedMonths[0]}-01`;
        }
        return new Date().toISOString().slice(0, 10);
    };
    
    const [date, setDate] = useState<string>(getInitialDate());
    const [mealCounts, setMealCounts] = useState<Record<string, string>>({});
    
    // Calculate min and max dates for managers (based on all assigned months)
    const getMinDate = () => {
        if (assignedMonths && assignedMonths.length > 0) {
            const sortedMonths = [...assignedMonths].sort();
            return `${sortedMonths[0]}-01`;
        }
        return undefined;
    };
    
    const getMaxDate = () => {
        if (assignedMonths && assignedMonths.length > 0) {
            const sortedMonths = [...assignedMonths].sort();
            const lastMonth = sortedMonths[sortedMonths.length - 1];
            // Get last day of the last assigned month
            const [year, month] = lastMonth.split('-');
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            return `${lastMonth}-${lastDay.toString().padStart(2, '0')}`;
        }
        return undefined;
    };
    
    // Check if a date falls within any assigned month
    const isDateInAssignedMonths = (dateStr: string): boolean => {
        if (!assignedMonths || assignedMonths.length === 0) return true;
        const month = dateStr.slice(0, 7); // Extract YYYY-MM
        return assignedMonths.includes(month);
    };

    useEffect(() => {
        if (isOpen) {
            // Reset date to first day of assigned month for managers, or today for others
            setDate(getInitialDate());
            // Reset meal counts
            const initialCounts: Record<string, string> = {};
            members.forEach(m => initialCounts[m._id] = '');
            setMealCounts(initialCounts);
        }
    }, [isOpen, members, assignedMonths]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const meals = Object.entries(mealCounts).map(([memberId, count]) => ({
            memberId,
            count: Number(count) || 0
        }));
        onSave({ date, meals });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-4 sm:p-6 shadow-lg border border-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">Add Daily Meals</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                const selectedDate = e.target.value;
                                // Validate that selected date is within assigned months for managers
                                if (assignedMonths && assignedMonths.length > 0) {
                                    if (!isDateInAssignedMonths(selectedDate)) {
                                        const monthsText = assignedMonths.map(m => formatMonth(m)).join(', ');
                                        alert(`You can only add data for the following months: ${monthsText}. Please select a date within these months.`);
                                        return;
                                    }
                                }
                                setDate(selectedDate);
                            }}
                            min={getMinDate()}
                            max={getMaxDate()}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                        {assignedMonths && assignedMonths.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                You can only add data for: {assignedMonths.map(m => formatMonth(m)).join(', ')}
                            </p>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {members.map((member) => (
                            <div key={member._id} className="flex items-center justify-between">
                                <label className="text-sm font-medium">{member.name}</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="0"
                                    value={mealCounts[member._id] || ''}
                                    onChange={(e) => setMealCounts({ ...mealCounts, [member._id]: e.target.value })}
                                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-right focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Save Meals
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
