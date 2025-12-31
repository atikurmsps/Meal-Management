'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AddGroceryModalProps, Grocery } from '@/types';

interface ExtendedAddGroceryModalProps extends AddGroceryModalProps {
    editData?: Grocery | null;
}

export default function AddGroceryModal({ isOpen, onClose, onSave, members, assignedMonth, editData }: ExtendedAddGroceryModalProps) {
    // For managers, set initial date to first day of assigned month, otherwise use today
    const getInitialDate = () => {
        if (assignedMonth && !editData) {
            return `${assignedMonth}-01`;
        }
        return new Date().toISOString().slice(0, 10);
    };
    
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [doneBy, setDoneBy] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [date, setDate] = useState<string>(getInitialDate());
    
    // Calculate min and max dates for managers
    const getMinDate = () => {
        if (assignedMonth) {
            return `${assignedMonth}-01`;
        }
        return undefined;
    };
    
    const getMaxDate = () => {
        if (assignedMonth) {
            // Get last day of the assigned month
            const [year, month] = assignedMonth.split('-');
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            return `${assignedMonth}-${lastDay.toString().padStart(2, '0')}`;
        }
        return undefined;
    };

    useEffect(() => {
        if (editData) {
            setDescription(editData.description || '');
            setAmount(editData.amount?.toString() || '');
            setDoneBy(typeof editData.doneBy === 'object' ? (editData.doneBy as any)._id : editData.doneBy || '');
            setNote(editData.note || '');
            setDate(editData.date ? new Date(editData.date).toISOString().slice(0, 10) : getInitialDate());
        } else {
            setDescription('');
            setAmount('');
            setDoneBy('');
            setNote('');
            setDate(getInitialDate());
        }
    }, [editData, isOpen, assignedMonth]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSave({
            description,
            amount: Number(amount),
            doneBy,
            note,
            date
        });
        // Reset form
        setDescription('');
        setAmount('');
        setDoneBy('');
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-4 sm:p-6 shadow-lg border border-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">{editData ? 'Edit Grocery' : 'Add Grocery'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Rice, Vegetables"
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Done By</label>
                        <select
                            value={doneBy}
                            onChange={(e) => setDoneBy(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        >
                            <option value="">Select Member</option>
                            {members.map((member) => (
                                <option key={member._id} value={member._id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                                const selectedDate = e.target.value;
                                // Validate that selected date is within assigned month for managers
                                if (assignedMonth) {
                                    const selectedMonth = selectedDate.slice(0, 7);
                                    if (selectedMonth !== assignedMonth) {
                                        alert(`You can only add data for ${assignedMonth}. Please select a date within this month.`);
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
                        {assignedMonth && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                You can only add data for {assignedMonth}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Note (Optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
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
                            {editData ? 'Update Grocery' : 'Add Grocery'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
