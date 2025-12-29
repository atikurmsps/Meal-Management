'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AddMealModalProps, Member } from '@/types';

export default function AddMealModal({ isOpen, onClose, members, onSave }: AddMealModalProps) {
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [mealCounts, setMealCounts] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            // Reset or fetch existing meals for this date?
            // For now, just reset to 0 or keep previous state if we want to be fancy.
            // Let's initialize with 0s or empty.
            const initialCounts: Record<string, string> = {};
            members.forEach(m => initialCounts[m._id] = '');
            setMealCounts(initialCounts);
        }
    }, [isOpen, members]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
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
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
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
