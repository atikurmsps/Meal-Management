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
      assignedMonths: user.assignedMonths,
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
    let { name, phoneNumber, password, email, role, assignedMonths, assignedMonth } = body;

    // Trim all string fields to remove whitespace
    name = typeof name === 'string' ? name.trim() : name;
    phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;

    if (!name || !phoneNumber || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, phone number, password, and role are required' },
        { status: 400 }
      );
    }

    // Ensure phoneNumber is not empty after trimming
    if (phoneNumber.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Phone number cannot be empty' },
        { status: 400 }
      );
    }

    // Check if phone number already exists (using trimmed value)
    // The schema has trim: true, so we need to check with trimmed value
    const trimmedPhoneNumber = phoneNumber.trim();
    
    const existingUser = await User.findOne({ phoneNumber: trimmedPhoneNumber });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Phone number "${trimmedPhoneNumber}" already exists` },
        { status: 409 }
      );
    }

    if (!['general', 'manager', 'super'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Managers must have assigned months
    if (role === 'manager') {
      const hasAssignedMonths = (assignedMonths && Array.isArray(assignedMonths) && assignedMonths.length > 0);
      const hasAssignedMonth = assignedMonth && typeof assignedMonth === 'string' && assignedMonth.trim() !== '';
      if (!hasAssignedMonths && !hasAssignedMonth) {
        return NextResponse.json(
          { success: false, error: 'Managers must have at least one assigned month' },
          { status: 400 }
        );
      }
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
        await User.deleteMany({ 
          $or: [{ phoneNumber: null }, { phoneNumber: '' }, { phoneNumber: { $exists: false } }] 
        });
      }
    } catch (cleanupError) {
      // Continue even if cleanup fails
    }

    // Try to drop old conflicting indexes if they exist
    try {
      const indexes = await User.collection.getIndexes();
      
      // Drop phone_1 index if it exists (old index from previous schema)
      if (indexes.phone_1) {
        try {
          await User.collection.dropIndex('phone_1');
        } catch {
          // Index may not exist or may be in use, continue
        }
      }
      
      // Drop assignedMonth_1 index if it exists (old index from previous schema)
      if (indexes.assignedMonth_1) {
        try {
          await User.collection.dropIndex('assignedMonth_1');
        } catch {
          // Index may not exist or may be in use, continue
        }
      }
      
      // Also try to drop any index with 'phone' or 'assignedMonth' in the name (but not assignedMonths)
      for (const indexName of Object.keys(indexes)) {
        if ((indexName.includes('phone') && indexName !== 'phoneNumber_1') || 
            (indexName.includes('assignedMonth') && !indexName.includes('assignedMonths'))) {
          try {
            await User.collection.dropIndex(indexName);
          } catch {
            // Index may not exist or may be in use, continue
          }
        }
      }
    } catch {
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

    // Only set assignedMonths if role is manager and it's provided
    if (role === 'manager') {
      if (assignedMonths && Array.isArray(assignedMonths) && assignedMonths.length > 0) {
        userData.assignedMonths = assignedMonths;
      } else if (assignedMonth && typeof assignedMonth === 'string' && assignedMonth.trim() !== '') {
        userData.assignedMonths = [assignedMonth.trim()];
      } else {
        // This should not happen due to validation above, but fail gracefully
        return NextResponse.json(
          { success: false, error: 'Managers must have at least one assigned month' },
          { status: 400 }
        );
      }
    } else {
      // Explicitly set to undefined for non-managers to avoid validation issues
      userData.assignedMonths = undefined;
    }

    // Final validation before creation
    if (role === 'manager') {
      if (!userData.assignedMonths || !Array.isArray(userData.assignedMonths) || userData.assignedMonths.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Managers must have at least one assigned month' },
          { status: 400 }
        );
      }
      // Ensure assignedMonths is an array of non-empty strings
      userData.assignedMonths = userData.assignedMonths.filter((m: string) => m && typeof m === 'string' && m.trim() !== '');
      if (userData.assignedMonths.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Managers must have at least one valid assigned month' },
          { status: 400 }
        );
      }
    } else {
      // Explicitly remove assignedMonths for non-managers
      delete userData.assignedMonths;
    }

    let user;
    try {
      user = await User.create(userData);
    } catch (createError: any) {
      // Handle validation errors for assignedMonth (old field name)
      if (createError.message?.includes('assignedMonth') && !createError.message?.includes('assignedMonths')) {
        // Try to drop the old index and retry
        try {
          const indexes = await User.collection.getIndexes();
          if (indexes.assignedMonth_1) {
            await User.collection.dropIndex('assignedMonth_1');
            // Retry creating the user
            user = await User.create(userData);
          } else {
            throw createError; // Re-throw if we can't fix it
          }
        } catch (retryError: any) {
          // Return a more helpful error message
          return NextResponse.json(
            { success: false, error: 'Managers must have at least one assigned month. Please ensure assignedMonths array is provided.' },
            { status: 400 }
          );
        }
      }
      // Handle duplicate key errors more gracefully
      else if (createError.code === 11000 || createError.message?.includes('duplicate key')) {
        // If it's the phone_1 index issue, try to drop it and retry
        if (createError.keyPattern?.phone || createError.message?.includes('phone_1')) {
          try {
            await User.collection.dropIndex('phone_1').catch(() => {});
            // Clean up null phoneNumber users again
            await User.deleteMany({ 
              $or: [{ phoneNumber: null }, { phoneNumber: '' }, { phoneNumber: { $exists: false } }] 
            });
            // Retry creating the user
            user = await User.create(userData);
          } catch (retryError: any) {
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
      assignedMonths: user.assignedMonths,
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
    const { userId, role, assignedMonths, assignedMonth, password, isActive, phoneNumber, name } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user - fetch full document since we'll be saving it
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Clean up any legacy assignedMonth field if it exists
    if ((user as any).assignedMonth && !user.assignedMonths) {
      user.assignedMonths = [(user as any).assignedMonth];
    }
    // Remove the legacy field using unset operator approach
    if ((user as any).assignedMonth) {
      (user as any).set('assignedMonth', undefined, { strict: false });
      (user as any).unset('assignedMonth');
    }

    // Update role if provided
    if (role !== undefined) {
      if (!['general', 'manager', 'super'].includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        );
      }

      // Managers must have at least one assigned month
      let monthsToAssign = assignedMonths || (assignedMonth ? [assignedMonth] : undefined);
      
      // If changing TO manager role without providing months, use existing months if user was already a manager
      if (role === 'manager' && (!monthsToAssign || !Array.isArray(monthsToAssign) || monthsToAssign.length === 0)) {
        if (user.role === 'manager' && user.assignedMonths && Array.isArray(user.assignedMonths) && user.assignedMonths.length > 0) {
          // User is already a manager, preserve existing months
          monthsToAssign = user.assignedMonths;
        } else {
          // New manager assignment requires months
          return NextResponse.json(
            { success: false, error: 'Managers must have at least one assigned month' },
            { status: 400 }
          );
        }
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
        user.assignedMonths = monthsToAssign || [];
      } else {
        // Not a manager, clear assignedMonths
        user.assignedMonths = undefined;
      }
    }

    // Update assigned months if role is manager and assignedMonths is provided (and role wasn't changed)
    if (user.role === 'manager' && role === undefined && assignedMonths !== undefined) {
      if (Array.isArray(assignedMonths) && assignedMonths.length > 0) {
        user.assignedMonths = assignedMonths;
      } else if (assignedMonth) {
        user.assignedMonths = [assignedMonth];
      } else {
        return NextResponse.json(
          { success: false, error: 'Managers must have at least one assigned month' },
          { status: 400 }
        );
      }
    }

    // Ensure managers always have assignedMonths (preserve existing if not being updated)
    if (user.role === 'manager' && (!user.assignedMonths || !Array.isArray(user.assignedMonths) || user.assignedMonths.length === 0)) {
      // This should not happen, but if it does, try to preserve from existing document
      // If we're here, something went wrong - fail validation
      return NextResponse.json(
        { success: false, error: 'Managers must have at least one assigned month' },
        { status: 400 }
      );
    }

    // Update password if provided
    if (password !== undefined && password.trim() !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      user.password = await hashPassword(password);
    }

    // Update name if provided
    if (name !== undefined && name.trim() !== '') {
      user.name = name.trim();
    }

    // Update phone number if provided
    if (phoneNumber !== undefined && phoneNumber.trim() !== '') {
      const trimmedPhone = phoneNumber.trim();
      // Check for duplicate phone number (excluding current user)
      const existingUser = await User.findOne({ phoneNumber: trimmedPhone, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Phone number already exists' },
          { status: 409 }
        );
      }
      user.phoneNumber = trimmedPhone;
    }

    // Update isActive if provided
    if (isActive !== undefined) {
      // Prevent deactivating the last super user
      if (user.role === 'super' && !isActive) {
        const superUsersCount = await User.countDocuments({ role: 'super', isActive: true });
        if (superUsersCount <= 1) {
          return NextResponse.json(
            { success: false, error: 'Cannot deactivate the last super user' },
            { status: 400 }
          );
        }
      }
      user.isActive = isActive;
    }

    // Ensure assignedMonths is set for managers before saving
    if (user.role === 'manager' && (!user.assignedMonths || !Array.isArray(user.assignedMonths) || user.assignedMonths.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Managers must have at least one assigned month' },
        { status: 400 }
      );
    }

    // Use findOneAndUpdate with $unset to properly remove legacy field from database
    const finalRole = role !== undefined ? role : user.role;
    const updateQuery: any = {};
    const unsetFields: any = {};
    
    if (role !== undefined) updateQuery.role = role;
    
    // Handle assignedMonths - always include it for managers
    // Always unset legacy assignedMonth field
    unsetFields.assignedMonth = '';
    
    if (finalRole === 'manager') {
      // For managers, always include assignedMonths in the update
      // Priority: use user.assignedMonths (set above), then assignedMonths from request, then existing value
      if (user.assignedMonths && Array.isArray(user.assignedMonths) && user.assignedMonths.length > 0) {
        updateQuery.assignedMonths = user.assignedMonths;
      } else if (assignedMonths !== undefined && Array.isArray(assignedMonths) && assignedMonths.length > 0) {
        updateQuery.assignedMonths = assignedMonths;
      } else {
        // Should not happen due to validation above, but include empty array as fallback
        updateQuery.assignedMonths = [];
      }
    } else if (role !== undefined) {
      // Role is being changed to non-manager, clear assignedMonths
      updateQuery.assignedMonths = undefined;
    }
    // If role is not manager and not being changed, don't include assignedMonths in update
    
    if (password !== undefined && password.trim() !== '') {
      updateQuery.password = user.password;
    }
    if (name !== undefined && name.trim() !== '') {
      updateQuery.name = user.name;
    }
    if (phoneNumber !== undefined && phoneNumber.trim() !== '') {
      updateQuery.phoneNumber = user.phoneNumber;
    }
    if (isActive !== undefined) {
      updateQuery.isActive = user.isActive;
    }

    const updateObj: any = { $set: updateQuery };
    if (Object.keys(unsetFields).length > 0) {
      updateObj.$unset = unsetFields;
    }

    const updatedUserDoc = await User.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true, runValidators: true }
    );

    if (!updatedUserDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const updatedUser: UserType = {
      _id: updatedUserDoc._id.toString(),
      phoneNumber: updatedUserDoc.phoneNumber,
      name: updatedUserDoc.name,
      email: updatedUserDoc.email,
      role: updatedUserDoc.role,
      assignedMonths: updatedUserDoc.assignedMonths,
      isActive: updatedUserDoc.isActive,
      createdAt: updatedUserDoc.createdAt.toISOString(),
      updatedAt: updatedUserDoc.updatedAt.toISOString(),
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
