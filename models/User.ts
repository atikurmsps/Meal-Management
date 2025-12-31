import mongoose from 'mongoose';

export type UserRole = 'general' | 'manager' | 'super';

export interface IUser extends mongoose.Document {
  phoneNumber: string;
  password: string;
  role: UserRole;
  assignedMonths?: string[]; // For managers - the months they can manage (array)
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
    index: true, // This creates the index, so we don't need to add it separately
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
  assignedMonths: {
    type: [String], // Array of months in YYYY-MM format
    required: function(this: IUser) {
      return this.role === 'manager';
    },
    validate: {
      validator: function(this: IUser, value: string[]) {
        // Only validate if role is manager
        if (this.role === 'manager') {
          return Array.isArray(value) && value.length > 0;
        }
        return true; // Not a manager, validation passes
      },
      message: 'Managers must have at least one assigned month'
    },
    default: undefined,
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

// Indexes for faster queries
UserSchema.index({ isActive: 1 }); // For filtering active users
// phoneNumber index is already created by unique: true, so we don't need to add it again
UserSchema.index({ role: 1 }); // For role-based queries
UserSchema.index({ assignedMonths: 1 }); // For manager month queries

// Force recompile the model to ensure we're using the latest schema
// This is important when schema fields change (e.g., assignedMonth -> assignedMonths)
if (mongoose.models.User) {
  delete (mongoose.models as any).User;
}

const UserModel = mongoose.model<IUser>('User', UserSchema);


export default UserModel;
