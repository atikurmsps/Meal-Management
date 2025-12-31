import mongoose from 'mongoose';

const GrocerySchema = new mongoose.Schema({
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
    doneBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional if generic admin adds it
    },
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
GrocerySchema.index({ month: 1 }); // Most common query
GrocerySchema.index({ doneBy: 1, month: 1 }); // Compound index for doneBy queries
GrocerySchema.index({ date: -1 }); // For sorting by date
GrocerySchema.index({ month: 1, date: -1 }); // Compound for month + date sorting

export default mongoose.models.Grocery || mongoose.model('Grocery', GrocerySchema);
