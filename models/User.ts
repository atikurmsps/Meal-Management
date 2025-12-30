import mongoose from 'mongoose';

export type UserRole = 'general' | 'manager' | 'super';

export interface IUser extends mongoose.Document {
  phoneNumber: string;
  password: string;
  role: UserRole;
  assignedMonth?: string; // For managers - the month they can manage
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['general', 'manager', 'super'],
    default: 'general',
  },
  assignedMonth: {
    type: String, // Format: YYYY-MM
    required: function() {
      return (this as any).role === 'manager';
    },
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
