import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    currentMonth: {
        type: String, // YYYY-MM format
        required: true,
        default: () => new Date().toISOString().slice(0, 7),
    },
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
