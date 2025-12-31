import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { setAuthCookie, clearAuthCookie, getCurrentUser, createSuperAdmin } from '@/lib/auth-server';
import type {
  ApiResponse,
  LoginRequest,
  SignupRequest,
  AuthUser,
  User as UserType,
} from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AuthUser | null>>> {
  try {
    await dbConnect();

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'login':
        return await handleLogin(data as LoginRequest);
      case 'signup':
        return await handleSignup(data as SignupRequest);
      case 'logout':
        return await handleLogout();
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API error:', error);
    // Ensure we always return valid JSON
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleLogin(data: LoginRequest): Promise<NextResponse<ApiResponse<AuthUser>>> {
  try {
    let { phoneNumber, password } = data;

    // Trim phone number to ensure consistency
    phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phoneNumber, isActive: true }).select('_id phoneNumber name role assignedMonth password');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
      assignedMonth: user.assignedMonth,
    };

    const token = generateToken(authUser);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: authUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

async function handleSignup(data: SignupRequest): Promise<NextResponse<ApiResponse<AuthUser>>> {
  try {
    let { phoneNumber, password, name } = data;

    // Trim all string fields
    phoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;
    name = typeof name === 'string' ? name.trim() : name;

    if (!phoneNumber || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Phone number, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if any users exist
    const existingUsers = await User.countDocuments();
    const isFirstUser = existingUsers === 0;

    // Check if phone number already exists (using trimmed value) - only select _id for efficiency
    const existingUser = await User.findOne({ phoneNumber }).select('_id').lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Phone number already exists' },
        { status: 409 }
      );
    }

    let role: 'general' | 'manager' | 'super' = 'general';

    if (isFirstUser) {
      // First user becomes super admin
      role = 'super';
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      phoneNumber,
      password: hashedPassword,
      name,
      role,
      isActive: true,
    });

    const authUser: AuthUser = {
      _id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
    };

    const token = generateToken(authUser);
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      data: authUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}

async function handleLogout(): Promise<NextResponse<ApiResponse<null>>> {
  await clearAuthCookie();
  return NextResponse.json({
    success: true,
    data: null,
  });
}
