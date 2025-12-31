import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    count: {
        type: Number,
        required: true,
        default: 0,
    },
    month: {
        type: String, // YYYY-MM format
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes for faster queries
MealSchema.index({ month: 1 }); // Most common query
MealSchema.index({ memberId: 1, month: 1 }); // Compound index for member-specific queries
MealSchema.index({ date: -1 }); // For sorting by date
MealSchema.index({ month: 1, date: -1 }); // Compound for month + date sorting

export default mongoose.models.Meal || mongoose.model('Meal', MealSchema);
