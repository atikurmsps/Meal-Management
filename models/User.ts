import mongoose from 'mongoose';

export type UserRole = 'general' | 'manager' | 'super';

export interface IUser extends mongoose.Document {
  phoneNumber: string;
  password: string;
  role: UserRole;
  assignedMonth?: string; // For managers - the month they can manage
  name: string;
  email?: string; // Optional email field
  isActive: boolean; // Replaces the old 'active' field from Member
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // Allows multiple null values, but enforces uniqueness for non-null values
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
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  email: {
    type: String,
    required: false,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Clean up any existing users with null/empty phoneNumber on model initialization
// This helps prevent the duplicate key error
if (mongoose.connection.readyState === 1) {
  UserModel.find({ $or: [{ phoneNumber: null }, { phoneNumber: '' }] })
    .then((usersWithNullPhone: any[]) => {
      if (usersWithNullPhone.length > 0) {
        console.log(`Found ${usersWithNullPhone.length} users with null/empty phoneNumber. These should be cleaned up.`);
        // Optionally delete or update these users
        // For now, we'll just log them
      }
    })
    .catch(() => {
      // Ignore errors during cleanup check
    });
}

export default UserModel;
