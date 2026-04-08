import React, { createContext, useContext } from 'react';
import { Department, Facility, Booking, BlackoutPeriod, BookingStatus, Location, FacilityApprover, FacilityDepartment, UserRole } from '../types';
import { useDepartments } from '../hooks/useDepartments';
import { useFacilities } from '../hooks/useFacilities';
import { useBookings } from '../hooks/useBookings';
import { useBlockedDates } from '../hooks/useBlockedDates';
import { useLocations } from '../hooks/useLocations';
import { useAuditLogs, type AuditLog, type AuditAction } from '../hooks/useAuditLogs';
import { useFacilityApprovers } from '../hooks/useFacilityApprovers';
import { useFacilityDepartments } from '../hooks/useFacilityDepartments';

interface AppContextType {
  departments: Department[];
  facilities: Facility[];
  locations: Location[];
  bookings: Booking[];
  blackouts: BlackoutPeriod[];
  blockedDates: BlackoutPeriod[];
  loading: boolean;
  error: string | null;
  addBooking: (
    booking: {
      facilityId: string;
      userId: string;
      userName: string;
      userEmail?: string;
      date: string;
      endDate?: string;
      startTime: string;
      endTime: string;
      purpose: string;
      autoApprove?: boolean;
    },
    recurrence?: { type: 'none' | 'weekly'; weeks: number }
  ) => Promise<string[]>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addFacility: (facility: Omit<Facility, 'id'>) => Promise<void>;
  updateFacility: (facility: Facility) => Promise<void>;
  deleteFacility: (id: string, hasBookings?: boolean) => Promise<void>;
  addDepartment: (name: string, description?: string) => Promise<void>;
  updateDepartment: (id: string, name: string, description?: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addLocation: (name: string) => Promise<void>;
  updateLocation: (id: string, name: string) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  addBlackout: (blackout: Omit<BlackoutPeriod, 'id'>) => Promise<void>;
  updateBlackout: (id: string, blackout: Partial<Omit<BlackoutPeriod, 'id'>>) => Promise<void>;
  deleteBlackout: (id: string) => Promise<void>;
  getDepartmentForBooking: (booking: Booking) => string | undefined;
  auditLogs: AuditLog[];
  auditLoading: boolean;
  auditError: string | null;
  createAuditLog: (params: { action: AuditAction; entityType: string; recordId: string; userId: string; userName: string; bookerId?: string }) => Promise<void>;
  reloadAuditLogs: () => Promise<void>;
  facilityApprovers: FacilityApprover[];
  addFacilityApprover: (facilityId: string, type: 'user' | 'department', profileId?: string, departmentId?: string, displayName?: string) => Promise<void>;
  removeFacilityApprover: (id: string) => Promise<void>;
  getApproversForFacility: (facilityId: string) => FacilityApprover[];
  canUserApproveFacility: (userId: string, userRole: UserRole, userDepartmentId: string | undefined, facility: Facility) => boolean;
  facilityDepartments: FacilityDepartment[];
  addFacilityDepartment: (facilityId: string, departmentId: string) => Promise<void>;
  removeFacilityDepartment: (id: string) => Promise<void>;
  getDepartmentsForFacility: (facilityId: string) => FacilityDepartment[];
  getVisibleFacilities: (facilities: Facility[], userDepartmentId: string | undefined) => Facility[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { departments, loading: dLoading, error: dError, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { facilities, loading: fLoading, error: fError, createFacility, updateFacility: updateFac, deleteFacility: deleteFac } = useFacilities();
  const { locations, loading: locLoading, error: locError, createLocation, updateLocation, deleteLocation } = useLocations();
  const { bookings, loading: bLoading, error: bError, createBooking, updateBookingStatus: updateStatus, updateBooking: updateBook, deleteBooking: delBooking } = useBookings();
  const { blackouts, loading: blLoading, error: blError, createBlackout, updateBlackout, deleteBlackout } = useBlockedDates();
  const { logs: auditLogs, loading: alLoading, error: alError, createLog: createAuditLog, reload: reloadAuditLogs } = useAuditLogs();
  const { approvers: facilityApprovers, loading: faLoading, error: faError, getApproversForFacility, addApprover: addFacilityApprover, removeApprover: removeFacilityApprover, canUserApproveFacility } = useFacilityApprovers();
  const { facilityDepartments, loading: fdLoading, error: fdError, getDepartmentsForFacility, addFacilityDepartment, removeFacilityDepartment, getVisibleFacilities } = useFacilityDepartments();

  const loading = dLoading || fLoading || locLoading || bLoading || blLoading || alLoading || faLoading || fdLoading;
  const error = dError || fError || locError || bError || blError || alError || faError || fdError;

  const getDepartmentForBooking = (booking: Booking): string | undefined => {
    const facility = facilities.find(f => f.id === booking.facilityId);
    return facility?.departmentId;
  };

  const cancelBooking = async (id: string) => {
    await updateStatus(id, 'cancelled');
  };

  return (
    <AppContext.Provider value={{
      departments,
      facilities,
      locations,
      bookings,
      blackouts,
      blockedDates: blackouts,
      loading,
      error,
      addBooking: createBooking,
      updateBookingStatus: updateStatus,
      cancelBooking,
      updateBooking: updateBook,
      deleteBooking: delBooking,
      addFacility: createFacility,
      updateFacility: updateFac,
      deleteFacility: deleteFac,
      addDepartment: createDepartment,
      updateDepartment,
      deleteDepartment,
      addLocation: createLocation,
      updateLocation,
      deleteLocation,
      addBlackout: createBlackout,
      updateBlackout,
      deleteBlackout,
      getDepartmentForBooking,
      auditLogs,
      auditLoading: alLoading,
      auditError: alError,
      createAuditLog,
      reloadAuditLogs,
      facilityApprovers,
      addFacilityApprover,
      removeFacilityApprover,
      getApproversForFacility,
      canUserApproveFacility,
      facilityDepartments,
      addFacilityDepartment,
      removeFacilityDepartment,
      getDepartmentsForFacility,
      getVisibleFacilities,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
