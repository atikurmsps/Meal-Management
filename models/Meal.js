import mongoose from 'mongoose';

const MealSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
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
});

export default mongoose.models.Meal || mongoose.model('Meal', MealSchema);
