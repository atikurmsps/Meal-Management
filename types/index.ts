// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Data Models
// Note: Member is now replaced by User - all users are members
// Keeping this for backward compatibility during migration
export interface Member {
  _id: string;
  name: string;
  email?: string;
  active: boolean;
}

export interface Meal {
  _id: string;
  memberId: string;
  count: number;
  date: string;
  month: string;
}

export interface Grocery {
  _id: string;
  doneBy: string;
  description: string;
  amount: number;
  note?: string;
  date: string;
  month: string;
}

export interface Deposit {
  _id: string;
  memberId: string;
  amount: number;
  date: string;
  month: string;
}

export interface Expense {
  _id: string;
  paidBy: string;
  splitAmong: string[];
  description: string;
  amount: number;
  note?: string;
  date: string;
  month: string;
}

export interface Settings {
  currentMonth: string;
}

// User and Authentication Types
export type UserRole = 'general' | 'manager' | 'super';

export interface User {
  _id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  role: UserRole;
  assignedMonth?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  _id: string;
  phoneNumber: string;
  name: string;
  role: UserRole;
  assignedMonth?: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface SignupRequest {
  phoneNumber: string;
  password: string;
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserRoleRequest {
  userId: string;
  role: UserRole;
  assignedMonth?: string;
}

// Permission Types
export interface UserPermissions {
  canViewAll: boolean;
  canManageMembers: boolean;
  canManageData: boolean;
  canManageCurrentMonth: boolean;
  canManageAssignedMonth: boolean;
  assignedMonth?: string;
}

// Dashboard Data Types
export interface MemberStats {
  _id: string;
  name: string;
  meals: number;
  deposit: number;
  mealBill: number;
  expenseBalance: number;
  balance: number;
  bill: number;
}

export interface DashboardData {
  month: string;
  totalGrocery: number;
  totalMeals: number;
  totalDeposit: number;
  totalExpense: number;
  totalBalance: number;
  mealRate: number;
  memberStats: MemberStats[];
}

// Member Profile Data Types
export interface MemberSummary {
  totalDeposit: number;
  totalGrocery: number;
  totalMeals: number;
  totalMealBill: number;
  currentBalance: number;
  expenseBalance: number;
}

export interface MemberExpense {
  _id: string;
  paidBy: {
    _id: string;
    name: string;
  };
  splitAmong: {
    _id: string;
    name: string;
  }[];
  description: string;
  amount: number;
  date: string;
  memberPaid: number;
  memberShare: number;
  memberBalance: number;
}

export interface MemberProfileData {
  member: {
    _id: string;
    name: string;
  };
  summary: MemberSummary;
  history: {
    deposits: Deposit[];
    meals: Meal[];
    groceries: Grocery[];
    expenses: MemberExpense[];
  };
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AddMealModalProps extends ModalProps {
  members: Member[];
  assignedMonth?: string; // For managers - restrict date selection to this month
  onSave: (data: { date: string; meals: { memberId: string; count: number }[] }) => void;
}

export interface AddGroceryModalProps extends ModalProps {
  members: Member[];
  assignedMonth?: string; // For managers - restrict date selection to this month
  onSave: (data: { doneBy: string; description: string; amount: number; note?: string; date: string }) => void;
}

export interface AddExpenseModalProps extends ModalProps {
  members: Member[];
  assignedMonth?: string; // For managers - restrict date selection to this month
  onSave: (data: { paidBy: string; splitAmong: string[]; description: string; amount: number; date: string }) => void;
}

export interface AddDepositModalProps extends ModalProps {
  members: Member[];
  assignedMonth?: string; // For managers - restrict date selection to this month
  onSave: (data: { memberId: string; amount: number; date: string }) => void;
}

export interface ConfirmModalProps extends ModalProps {
  onConfirm: () => void;
  title: string;
  message: string;
  onCancel?: () => void;
}

// Form Data Types
export interface MealFormData {
  memberId: string;
  count: number;
  date: string;
}

export interface GroceryFormData {
  doneBy: string;
  description: string;
  amount: number;
  note?: string;
  date: string;
}

export interface ExpenseFormData {
  paidBy: string;
  splitAmong: string[];
  description: string;
  amount: number;
  date: string;
}

export interface DepositFormData {
  memberId: string;
  amount: number;
  date: string;
}
