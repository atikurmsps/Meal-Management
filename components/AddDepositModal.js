'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddDepositModal({ isOpen, onClose, members, onSave, editData = null }) {
    const [memberId, setMemberId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (editData) {
            setMemberId(editData.memberId?._id || editData.memberId || '');
            setAmount(editData.amount?.toString() || '');
            setDate(editData.date ? new Date(editData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        } else {
            setMemberId('');
            setAmount('');
            setDate(new Date().toISOString().slice(0, 10));
        }
    }, [editData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: editData?._id,
            memberId,
            amount: Number(amount),
            date
        });
        // Reset
        setMemberId('');
        setAmount('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary">{editData ? 'Edit Deposit' : 'Add Deposit'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Member</label>
                        <select
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        >
                            <option value="">Select Member</option>
                            {members.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.name}
                                </option>
                            ))}
                        </select>
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
                        <label className="block text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
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
                            {editData ? 'Update Deposit' : 'Add Deposit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
