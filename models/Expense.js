import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Please provide a description.'],
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount.'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    splitAmong: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    note: {
        type: String,
    },
    month: {
        type: String, // YYYY-MM format
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
ExpenseSchema.index({ month: 1 }); // Most common query
ExpenseSchema.index({ paidBy: 1, month: 1 }); // Compound index for paidBy queries
ExpenseSchema.index({ splitAmong: 1, month: 1 }); // For filtering expenses by splitAmong
ExpenseSchema.index({ date: -1 }); // For sorting by date
ExpenseSchema.index({ month: 1, date: -1 }); // Compound for month + date sorting

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
