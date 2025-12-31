import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    month: {
        type: String, // YYYY-MM format
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
DepositSchema.index({ month: 1 }); // Most common query
DepositSchema.index({ memberId: 1, month: 1 }); // Compound index for member-specific queries
DepositSchema.index({ date: -1 }); // For sorting by date
DepositSchema.index({ month: 1, date: -1 }); // Compound for month + date sorting

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
