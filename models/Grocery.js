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
        ref: 'Member',
        required: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: false, // Optional if generic admin adds it
    },
    note: {
        type: String,
    },
    month: {
        type: String, // YYYY-MM format
        required: true,
    },
});

export default mongoose.models.Grocery || mongoose.model('Grocery', GrocerySchema);
