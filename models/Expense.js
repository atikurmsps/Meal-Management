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
});

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
