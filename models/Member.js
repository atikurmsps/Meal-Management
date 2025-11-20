import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this member.'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: false,
    },
    active: {
        type: Boolean,
        default: true,
    },
});

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);
