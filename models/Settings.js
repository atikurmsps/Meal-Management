import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
    currentMonth: {
        type: String, // YYYY-MM format
        required: true,
        default: () => new Date().toISOString().slice(0, 7),
    },
}, {
    timestamps: false, // Settings don't need timestamps
});

// Index for faster lookups (there's typically only one settings document)
SettingsSchema.index({ currentMonth: 1 });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
