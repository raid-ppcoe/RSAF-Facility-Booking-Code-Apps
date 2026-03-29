import React, { createContext, useContext } from 'react';
import { Department, Facility, Booking, BlackoutPeriod, BookingStatus } from '../types';
import { useDepartments } from '../hooks/useDepartments';
import { useFacilities } from '../hooks/useFacilities';
import { useBookings } from '../hooks/useBookings';
import { useBlockedDates } from '../hooks/useBlockedDates';
import { useAuditLogs, type AuditLog, type AuditAction } from '../hooks/useAuditLogs';

interface AppContextType {
  departments: Department[];
  facilities: Facility[];
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
      date: string;
      startTime: string;
      endTime: string;
      purpose: string;
    },
    recurrence?: { type: 'none' | 'weekly'; weeks: number }
  ) => Promise<void>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  addFacility: (facility: Omit<Facility, 'id'>) => Promise<void>;
  updateFacility: (facility: Facility) => Promise<void>;
  deleteFacility: (id: string) => Promise<void>;
  addDepartment: (name: string, description?: string) => Promise<void>;
  updateDepartment: (id: string, name: string, description?: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addBlackout: (blackout: Omit<BlackoutPeriod, 'id'>) => Promise<void>;
  updateBlackout: (id: string, blackout: Partial<Omit<BlackoutPeriod, 'id'>>) => Promise<void>;
  deleteBlackout: (id: string) => Promise<void>;
  getDepartmentForBooking: (booking: Booking) => string | undefined;
  auditLogs: AuditLog[];
  auditLoading: boolean;
  auditError: string | null;
  createAuditLog: (params: { action: AuditAction; entityType: string; recordId: string; userId: string; userName: string; bookerId?: string }) => Promise<void>;
  reloadAuditLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { departments, loading: dLoading, error: dError, createDepartment, updateDepartment, deleteDepartment } = useDepartments();
  const { facilities, loading: fLoading, error: fError, createFacility, updateFacility: updateFac, deleteFacility: deleteFac } = useFacilities();
  const { bookings, loading: bLoading, error: bError, createBooking, updateBookingStatus: updateStatus, deleteBooking: delBooking } = useBookings();
  const { blackouts, loading: blLoading, error: blError, createBlackout, updateBlackout, deleteBlackout } = useBlockedDates();
  const { logs: auditLogs, loading: alLoading, error: alError, createLog: createAuditLog, reload: reloadAuditLogs } = useAuditLogs();

  const loading = dLoading || fLoading || bLoading || blLoading;
  const error = dError || fError || bError || blError;

  const getDepartmentForBooking = (booking: Booking): string | undefined => {
    const facility = facilities.find(f => f.id === booking.facilityId);
    return facility?.departmentId;
  };

  return (
    <AppContext.Provider value={{
      departments,
      facilities,
      bookings,
      blackouts,
      blockedDates: blackouts,
      loading,
      error,
      addBooking: createBooking,
      updateBookingStatus: updateStatus,
      deleteBooking: delBooking,
      addFacility: createFacility,
      updateFacility: updateFac,
      deleteFacility: deleteFac,
      addDepartment: createDepartment,
      updateDepartment,
      deleteDepartment,
      addBlackout: createBlackout,
      updateBlackout,
      deleteBlackout,
      getDepartmentForBooking,
      auditLogs,
      auditLoading: alLoading,
      auditError: alError,
      createAuditLog,
      reloadAuditLogs,
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
