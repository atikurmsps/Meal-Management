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
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
