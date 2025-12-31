import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';
import { hashPassword } from '@/lib/auth';
import User from '@/models/User';
import type { ApiResponse, User as UserType, UpdateUserRoleRequest } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<UserType[]>>> {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super users can view all users
    if (currentUser.role !== 'super') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const users = await User.find({}).select('-password -__v').sort({ createdAt: -1 }).lean();

    const userData: UserType[] = users.map((user: any) => ({
      _id: user._id?.toString() || '',
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedMonth: user.assignedMonth,
      isActive: user.isActive,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UserType>>> {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super users can create new users
    if (currentUser.role !== 'super') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    let { name, phoneNumber, password, email, role, assignedMonth } = body;

    // Trim all string fields to remove whitespace
    name = typeof name === 'string' ? name.trim() : name;
    phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;

    if (!name || !phoneNumber || !password || !role) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name, phone number, password, and role are required' },
        { status: 400 }
      );
    }

    // Ensure phoneNumber is not empty after trimming
    if (phoneNumber.length === 0) {
      console.log('Phone number is empty after trimming');
      return NextResponse.json(
        { success: false, error: 'Phone number cannot be empty' },
        { status: 400 }
      );
    }

    // Check if phone number already exists (using trimmed value)
    // The schema has trim: true, so we need to check with trimmed value
    const trimmedPhoneNumber = phoneNumber.trim();
    console.log('Checking for existing phone number:', trimmedPhoneNumber);
    
    const existingUser = await User.findOne({ phoneNumber: trimmedPhoneNumber });
    if (existingUser) {
      console.log('Phone number already exists:', {
        existing: existingUser.phoneNumber,
        existingId: existingUser._id,
        attempted: trimmedPhoneNumber,
        match: existingUser.phoneNumber === trimmedPhoneNumber
      });
      
      // Also check all users to help debug
      const allUsers = await User.find({}).select('phoneNumber name');
      console.log('All existing phone numbers:', allUsers.map(u => ({ phone: u.phoneNumber, name: u.name })));
      
      return NextResponse.json(
        { success: false, error: `Phone number "${trimmedPhoneNumber}" already exists` },
        { status: 409 }
      );
    }
    
    console.log('Phone number is unique, proceeding with user creation');

    if (!['general', 'manager', 'super'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Managers must have an assigned month
    if (role === 'manager' && !assignedMonth) {
      return NextResponse.json(
        { success: false, error: 'Managers must have an assigned month' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Clean up any users with null/empty phoneNumber before creating new user
    // This prevents the duplicate key error on the sparse index
    try {
      const usersWithNullPhone = await User.find({ 
        $or: [{ phoneNumber: null }, { phoneNumber: '' }, { phoneNumber: { $exists: false } }] 
      });
      
      if (usersWithNullPhone.length > 0) {
        console.log(`Found ${usersWithNullPhone.length} users with null/empty phoneNumber. Cleaning up...`);
        await User.deleteMany({ 
          $or: [{ phoneNumber: null }, { phoneNumber: '' }, { phoneNumber: { $exists: false } }] 
        });
        console.log('Cleaned up users with null phoneNumber.');
      }
    } catch (cleanupError) {
      console.log('Cleanup check failed (this is okay):', cleanupError);
      // Continue even if cleanup fails
    }

    // Try to drop old conflicting index if it exists
    try {
      const indexes = await User.collection.getIndexes();
      console.log('Current indexes:', Object.keys(indexes));
      
      // Drop phone_1 index if it exists (old index from previous schema)
      if (indexes.phone_1) {
        console.log('Found old phone_1 index, attempting to drop it...');
        try {
          await User.collection.dropIndex('phone_1');
          console.log('Successfully dropped old phone_1 index.');
        } catch (dropError: any) {
          console.log('Could not drop phone_1 index (may not exist or may be in use):', dropError.message);
        }
      }
      
      // Also try to drop any index with 'phone' in the name
      for (const indexName of Object.keys(indexes)) {
        if (indexName.includes('phone') && indexName !== 'phoneNumber_1') {
          console.log(`Found index ${indexName}, attempting to drop it...`);
          try {
            await User.collection.dropIndex(indexName);
            console.log(`Successfully dropped index ${indexName}.`);
          } catch (dropError: any) {
            console.log(`Could not drop index ${indexName}:`, dropError.message);
          }
        }
      }
    } catch (indexError) {
      console.log('Index check failed (this is okay):', indexError);
      // Continue even if index operations fail
    }

    const userData: any = {
      name: name.trim(),
      phoneNumber: trimmedPhoneNumber, // Use the trimmed version
      password: hashedPassword,
      role,
      isActive: true,
    };

    // Add email if provided
    if (email && typeof email === 'string') {
      userData.email = email.trim();
    }

    // Only set assignedMonth if role is manager and it's provided
    if (role === 'manager' && assignedMonth) {
      userData.assignedMonth = assignedMonth;
    } else if (role !== 'manager') {
      // Explicitly set to undefined for non-managers to avoid validation issues
      userData.assignedMonth = undefined;
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    let user;
    try {
      user = await User.create(userData);
      console.log('User created successfully:', user._id);
    } catch (createError: any) {
      // Handle duplicate key errors more gracefully
      if (createError.code === 11000 || createError.message?.includes('duplicate key')) {
        console.log('Duplicate key error detected. Error details:', {
          code: createError.code,
          keyPattern: createError.keyPattern,
          keyValue: createError.keyValue,
          message: createError.message
        });
        
        // If it's the phone_1 index issue, try to drop it and retry
        if (createError.keyPattern?.phone || createError.message?.includes('phone_1')) {
          console.log('Attempting to fix phone_1 index issue...');
          try {
            await User.collection.dropIndex('phone_1').catch(() => {});
            // Clean up null phoneNumber users again
            await User.deleteMany({ 
              $or: [{ phoneNumber: null }, { phoneNumber: '' }, { phoneNumber: { $exists: false } }] 
            });
            // Retry creating the user
            user = await User.create(userData);
            console.log('User created successfully after fixing index issue:', user._id);
          } catch (retryError: any) {
            console.error('Retry after index fix failed:', retryError);
            throw createError; // Throw original error
          }
        } else {
          // Regular duplicate phone number error
          throw createError;
        }
      } else {
        throw createError;
      }
    }

    const newUser: UserType = {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedMonth: user.assignedMonth,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError' && 'errors' in error) {
        const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
        errorMessage = validationErrors.join(', ');
      }
      // Handle duplicate key errors
      if (error.message.includes('E11000') || error.message.includes('duplicate key')) {
        errorMessage = 'Phone number already exists';
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse<UserType>>> {
  try {
    await dbConnect();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only super users can update user roles
    if (currentUser.role !== 'super') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body: UpdateUserRoleRequest = await request.json();
    const { userId, role, assignedMonth } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }

    if (!['general', 'manager', 'super'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Managers must have an assigned month
    if (role === 'manager' && !assignedMonth) {
      return NextResponse.json(
        { success: false, error: 'Managers must have an assigned month' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent changing the last super user's role
    if (user.role === 'super' && role !== 'super') {
      const superUsersCount = await User.countDocuments({ role: 'super', isActive: true });
      if (superUsersCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot remove the last super user' },
          { status: 400 }
        );
      }
    }

    user.role = role;
    if (role === 'manager') {
      user.assignedMonth = assignedMonth;
    } else {
      user.assignedMonth = undefined;
    }

    await user.save();

    const updatedUser: UserType = {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedMonth: user.assignedMonth,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
