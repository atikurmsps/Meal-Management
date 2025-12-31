'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/dateUtils';
import type { Meal } from '@/types';

interface EditMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { id: string; count: number }) => void;
    editData?: Meal | null;
}

export default function EditMealModal({ isOpen, onClose, onSave, editData }: EditMealModalProps) {
    const [count, setCount] = useState<string>('');

    useEffect(() => {
        if (editData) {
            setCount(editData.count?.toString() || '');
        } else {
            setCount('');
        }
    }, [editData, isOpen]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({
            id: editData?._id || '',
            count: Number(count)
        });
        setCount('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">Edit Meal Count</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="text"
                            value={editData?.date ? formatDate(editData.date) : ''}
                            disabled
                            className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Member</label>
                        <input
                            type="text"
                            value={typeof editData?.memberId === 'object' ? (editData.memberId as any).name : ''}
                            disabled
                            className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Meal Count</label>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            placeholder="0"
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                            autoFocus
                        />
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
                            Update Meal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
