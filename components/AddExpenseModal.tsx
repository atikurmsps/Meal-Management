'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AddExpenseModalProps, Expense } from '@/types';

interface ExtendedAddExpenseModalProps extends AddExpenseModalProps {
    editData?: Expense | null;
}

export default function AddExpenseModal({ isOpen, onClose, onSave, members, assignedMonth, editData }: ExtendedAddExpenseModalProps) {
    // For managers, set initial date to first day of assigned month, otherwise use today
    const getInitialDate = () => {
        if (assignedMonth && !editData) {
            return `${assignedMonth}-01`;
        }
        return new Date().toISOString().slice(0, 10);
    };
    
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [paidBy, setPaidBy] = useState<string>('');
    const [splitAmong, setSplitAmong] = useState<string[]>([]);
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
            setPaidBy(typeof editData.paidBy === 'object' ? (editData.paidBy as any)._id : editData.paidBy || '');
            setSplitAmong(editData.splitAmong?.map((m: any) => m._id || m) || []);
            setNote(editData.note || '');
            setDate(editData.date ? new Date(editData.date).toISOString().slice(0, 10) : getInitialDate());
        } else {
            setDescription('');
            setAmount('');
            setPaidBy('');
            setSplitAmong(members.map(m => m._id)); // Default: all members
            setNote('');
            setDate(getInitialDate());
        }
    }, [editData, isOpen, members, assignedMonth]);

    const toggleMember = (memberId: string) => {
        setSplitAmong(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const splitAmount = splitAmong.length > 0 ? (Number(amount) / splitAmong.length).toFixed(2) : 0;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (splitAmong.length === 0) {
            alert('Please select at least one member to split the expense among.');
            return;
        }
        onSave({
            description,
            amount: Number(amount),
            paidBy,
            splitAmong,
            date
        });
        // Reset form
        setDescription('');
        setAmount('');
        setPaidBy('');
        setSplitAmong(members.map(m => m._id));
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">{editData ? 'Edit Expense' : 'Add Expense'}</h2>
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
                            placeholder="e.g., House Rent, WiFi Bill"
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
                        <label className="block text-sm font-medium text-muted-foreground">Paid By</label>
                        <select
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
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
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Split Among</label>
                        <div className="space-y-2 p-3 rounded-md border border-input bg-muted/20">
                            {members.map((member) => (
                                <label key={member._id} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={splitAmong.includes(member._id)}
                                        onChange={() => toggleMember(member._id)}
                                        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-foreground">{member.name}</span>
                                </label>
                            ))}
                        </div>
                        {splitAmong.length > 0 && amount && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Split: <span className="font-medium text-primary">৳{splitAmount}</span> per person ({splitAmong.length} {splitAmong.length === 1 ? 'member' : 'members'})
                            </p>
                        )}
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
                            {editData ? 'Update Expense' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
