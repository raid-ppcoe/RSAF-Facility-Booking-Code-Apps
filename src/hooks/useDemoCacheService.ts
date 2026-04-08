import { useTutorialModeContext } from '../contexts/TutorialModeContext';
import { DemoBooking, DemoFacility } from '../types/tutorialTypes';
import { useCallback } from 'react';

/**
 * Hook to manage demo data cache for tutorial mode
 * Provides convenient methods for adding and retrieving demo bookings/facilities
 */
export function useDemoCacheService() {
  const { addDemoBooking, addDemoFacility, getDemoBookings, getDemoFacilities, clearDemoCache } = useTutorialModeContext();

  const createDemoBooking = useCallback(
    (bookingData: {
      id: string;
      facilityId: string;
      facilityName: string;
      date: string;
      endDate?: string;
      startTime: string;
      endTime: string;
      purpose: string;
      status?: 'pending' | 'approved';
    }): DemoBooking => {
      const demoBooking: DemoBooking = {
        isDemo: true,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...bookingData,
      };
      addDemoBooking(demoBooking);
      return demoBooking;
    },
    [addDemoBooking]
  );

  const createDemoFacility = useCallback(
    (facilityData: {
      id: string;
      name: string;
      departmentId: string;
      departmentName: string;
      capacity: number;
      description: string;
      locationId?: string;
      locationName?: string;
      maxRecurrenceWeeks?: number;
      autoApprove?: boolean;
      approvalMode?: 'department_admins' | 'specific_approvers';
      approvers?: Array<{ id: string; name: string; type: 'user' | 'department' }>;
    }): DemoFacility => {
      const demoFacility: DemoFacility = {
        isDemo: true,
        maxRecurrenceWeeks: 4,
        autoApprove: false,
        approvalMode: 'department_admins',
        approvers: [],
        ...facilityData,
      };
      addDemoFacility(demoFacility);
      return demoFacility;
    },
    [addDemoFacility]
  );

  const getDemoBookingById = useCallback(
    (id: string): DemoBooking | undefined => {
      return getDemoBookings().find((b) => b.id === id);
    },
    [getDemoBookings]
  );

  const getDemoFacilityById = useCallback(
    (id: string): DemoFacility | undefined => {
      return getDemoFacilities().find((f) => f.id === id);
    },
    [getDemoFacilities]
  );

  const getDemoBookingsByFacility = useCallback(
    (facilityId: string): DemoBooking[] => {
      return getDemoBookings().filter((b) => b.facilityId === facilityId);
    },
    [getDemoBookings]
  );

  const getDemoFacilitiesByDepartment = useCallback(
    (departmentId: string): DemoFacility[] => {
      return getDemoFacilities().filter((f) => f.departmentId === departmentId);
    },
    [getDemoFacilities]
  );

  return {
    // Create demo data
    createDemoBooking,
    createDemoFacility,

    // Retrieve demo data
    getDemoBookings,
    getDemoFacilities,
    getDemoBookingById,
    getDemoFacilityById,
    getDemoBookingsByFacility,
    getDemoFacilitiesByDepartment,

    // Clear demo data
    clearDemoCache,

    // Helpers
    hasAnyCacheData: () => {
      return getDemoBookings().length > 0 || getDemoFacilities().length > 0;
    },
    getDemoCacheStats: () => ({
      bookingCount: getDemoBookings().length,
      facilityCount: getDemoFacilities().length,
    }),
  };
}
