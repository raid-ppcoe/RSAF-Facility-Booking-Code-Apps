export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  avatar?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Facility {
  id: string;
  name: string;
  departmentId: string;
  capacity: number;
  description: string;
  image?: string;
  maxRecurrenceWeeks: number;
  allowedRecurrencePatterns?: number;
  autoApprove?: boolean;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  facilityId: string;
  userId: string;
  userName: string;
  userPhone?: string;
  date: string;
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
