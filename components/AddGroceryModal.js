'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddGroceryModal({ isOpen, onClose, onSave, editData = null }) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        if (editData) {
            setDescription(editData.description || '');
            setAmount(editData.amount?.toString() || '');
            setNote(editData.note || '');
            setDate(editData.date ? new Date(editData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        } else {
            setDescription('');
            setAmount('');
            setNote('');
            setDate(new Date().toISOString().slice(0, 10));
        }
    }, [editData, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: editData?._id,
            description,
            amount: Number(amount),
            note,
            date
        });
        // Reset form
        setDescription('');
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().slice(0, 10));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border border-border">
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
                        <label className="block text-sm font-medium text-muted-foreground">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Note (Optional)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows="3"
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
