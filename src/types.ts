export type UserRole = 'user' | 'admin' | 'super_admin' | 'global_admin';

export function isGlobalAdmin(role?: UserRole | null): boolean {
  return role === 'global_admin';
}

export function isSuperAdminOrAbove(role?: UserRole | null): boolean {
  return role === 'super_admin' || role === 'global_admin';
}

export function isAdminOrAbove(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'super_admin' || role === 'global_admin';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
  tutorialRole?: UserRole;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Location {
  id: string;
  name: string;
}

export type ApprovalMode = 'department_admins' | 'specific_approvers';

export interface Facility {
  id: string;
  name: string;
  departmentId: string;
  capacity: number;
  description: string;
  locationId?: string;
  image?: string;
  maxRecurrenceWeeks: number;
  allowedRecurrencePatterns?: number;
  autoApprove?: boolean;
  approvalMode?: ApprovalMode;
  requestClearance?: boolean;
}

export interface FacilityApprover {
  id: string;
  facilityId: string;
  approverType: 'user' | 'department';
  approverProfileId?: string;
  approverDepartmentId?: string;
  displayName?: string;
}

export interface FacilityDepartment {
  id: string;
  facilityId: string;
  departmentId: string;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'processing_clearance' | 'clearance_processed';

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string;
  createdAt: string;
}

export interface BlackoutPeriod {
  id: string;
  facilityId: string | null;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  createdBy: string;
  isFullDay: boolean;
  isGlobal: boolean;
}

export interface ClearanceRecord {
  id: string;
  bookingId: string;
  fullName: string;
  rank: string;
  phone: string;
  email: string;
}
