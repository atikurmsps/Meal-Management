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

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const userData: UserType[] = users.map(user => ({
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      assignedMonth: user.assignedMonth,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
    console.log('Starting user creation...');
    await dbConnect();
    console.log('Database connected');

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('No current user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Current user:', currentUser.role);

    // Only super users can create new users
    if (currentUser.role !== 'super') {
      console.log('User is not super admin');
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', { ...body, password: '[HIDDEN]' });
    const { name, phoneNumber, password, role, assignedMonth } = body;

    if (!name || !phoneNumber || !password || !role) {
      console.log('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Name, phone number, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log('Phone number already exists');
      return NextResponse.json(
        { success: false, error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    if (!['general', 'manager', 'super'].includes(role)) {
      console.log('Invalid role:', role);
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Managers must have an assigned month
    if (role === 'manager' && !assignedMonth) {
      console.log('Manager without assigned month');
      return NextResponse.json(
        { success: false, error: 'Managers must have an assigned month' },
        { status: 400 }
      );
    }

    console.log('Hashing password...');
    // Hash password
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    const userData: any = {
      name,
      phoneNumber,
      password: hashedPassword,
      role,
      isActive: true,
    };

    if (role === 'manager') {
      userData.assignedMonth = assignedMonth;
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    const user = await User.create(userData);
    console.log('User created successfully:', user._id);

    const newUser: UserType = {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      assignedMonth: user.assignedMonth,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    console.log('Returning success response');
    return NextResponse.json({
      success: true,
      data: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
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
