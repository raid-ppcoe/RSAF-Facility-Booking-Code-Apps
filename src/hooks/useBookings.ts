import { useState, useEffect, useCallback } from 'react';
import { Cr71a_bookingsService } from '../generated/services/Cr71a_bookingsService';
import { Cr71a_booking2scr71a_status } from '../generated/models/Cr71a_bookingsModel';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';
import type { Booking, BookingStatus } from '../types';
import { addWeeks, format, parseISO } from 'date-fns';
import { checkTimeOverlap, checkDateTimeOverlap } from '../utils/timeUtils';
import { BOOKING_STATUS_CODES, RECURRENCE_PATTERN } from '../constants/bookingStatuses';
import { useTutorialMode } from './useTutorialMode';
import { useDemoCacheService } from './useDemoCacheService';
import { generateMockBookingId, logTutorialOperation } from '../utils/tutorialInterceptor';

const STATUS_TO_DATAVERSE: Record<BookingStatus, number> = {
  pending: 406210000,
  approved: 406210001,
  rejected: 406210002,
  cancelled: 406210002, // Dataverse has no Cancelled choice; maps to Rejected
};

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['rejected', 'cancelled'],
  rejected: [],
  cancelled: [],
};

const DATAVERSE_TO_STATUS: Record<number, BookingStatus> = {
  406210000: 'pending',
  406210001: 'approved',
  406210002: 'rejected',
};

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tutorial mode integration
  const { isTutorialMode, addDemoBooking } = useTutorialMode();
  const { createDemoBooking, getDemoBookings } = useDemoCacheService();

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_bookingsService.getAll({
        select: [
          'cr71a_booking2id',
          'cr71a_bookingpurpose',
          '_cr71a_facilityname_value',
          '_cr71a_fullname_value',
          'cr71a_username',
          'cr71a_useremail',
          'cr71a_date',
          'cr71a_starttime',
          'cr71a_endtime',
          'cr71a_status',
          'cr71a_purpose',
          'createdon',
        ],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_date desc', 'cr71a_starttime asc'],
        top: 500,
      });
      
      let allBookings: Booking[] = [];
      
      if (result.data) {
        // Collect unique profile IDs to fetch phone numbers
        const profileIds = [...new Set(result.data.map(b => b._cr71a_fullname_value).filter(Boolean))] as string[];
        
        // Fetch phone numbers for all bookers in one batch
        let phoneMap = new Map<string, string>();
        if (profileIds.length > 0) {
          try {
            const filterParts = profileIds.map(id => `cr71a_profileid eq '${id}'`).join(' or ');
            const profileResult = await Cr71a_profilesService.getAll({
              select: ['cr71a_profileid', 'cr71a_phone'],
              filter: `statecode eq 0 and (${filterParts})`,
              top: 500,
            });
            if (profileResult.data) {
              profileResult.data.forEach(p => {
                if (p.cr71a_phone) {
                  phoneMap.set(p.cr71a_profileid, p.cr71a_phone);
                }
              });
            }
          } catch (err) {
            console.warn('Failed to fetch profile phones:', err);
          }
        }

        allBookings = result.data.map((b) => {
          const startDate = (b.cr71a_date || '').substring(0, 10);
          
          // Derive end date properly from the end ISO time
          // We parse it as a local date object to avoid UTC-date offset shifts
          let endDate = startDate;
          if (b.cr71a_endtime) {
            const endDT = new Date(b.cr71a_endtime);
            if (!isNaN(endDT.getTime())) {
              // Use local timezone to get the date string (yyyy-MM-dd)
              const year = endDT.getFullYear();
              const month = (endDT.getMonth() + 1).toString().padStart(2, '0');
              const day = endDT.getDate().toString().padStart(2, '0');
              endDate = `${year}-${month}-${day}`;
            }
          }

          return {
            id: b.cr71a_booking2id,
            facilityId: b._cr71a_facilityname_value || '',
            userId: b._cr71a_fullname_value || '',
            userName: b.cr71a_username || b.cr71a_bookingpurpose || '',
            userEmail: b.cr71a_useremail || '',
            userPhone: phoneMap.get(b._cr71a_fullname_value || '') || '',
            date: startDate,
            endDate: endDate !== startDate ? endDate : undefined,
            startTime: b.cr71a_starttime ? format(new Date(b.cr71a_starttime), 'HH:mm') : '',
            endTime: b.cr71a_endtime ? format(new Date(b.cr71a_endtime), 'HH:mm') : '',
            status: DATAVERSE_TO_STATUS[b.cr71a_status as number] || 'pending',
            purpose: b.cr71a_purpose || '',
            createdAt: b.createdon || '',
          };
        });
      }
      
      // In tutorial mode, merge demo bookings with real bookings
      if (isTutorialMode) {
        const demoBookings = getDemoBookings();
        const demoBookingModels: Booking[] = demoBookings.map((db) => ({
          id: db.id,
          facilityId: db.facilityId,
          userId: '',
          userName: 'You (Demo)',
          userEmail: '',
          userPhone: '',
          date: db.date,
          endDate: db.endDate,
          startTime: db.startTime,
          endTime: db.endTime,
          status: (db.status || 'pending') as BookingStatus,
          purpose: db.purpose,
          createdAt: new Date().toISOString(),
        }));
        allBookings = [...allBookings, ...demoBookingModels];
      }
      
      setBookings(allBookings);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [isTutorialMode, getDemoBookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  /**
   * Validates if a booking time slot is available
   * Prevents race condition where concurrent bookings can double-book a facility
   */
  const validateBookingAvailability = useCallback(
    async (facilityId: string, startDate: string, startTime: string, endDate: string, endTime: string): Promise<void> => {
      try {
        // Construct requested range
        const requestedStartStr = `${startDate} ${startTime}`;
        const requestedEndStr = `${endDate} ${endTime}`;

        // Fetch bookings that might overlap. 
        // Logic: Find anything that starts on or before our end date.
        // We'll also filter for active/approved/pending bookings.
        // We look for any booking that started within the last few days to catch multi-day ones.
        const twoWeeksAgo = format(addWeeks(new Date(), -2), 'yyyy-MM-dd');

        const result = await Cr71a_bookingsService.getAll({
          filter: `_cr71a_facilityname_value eq '${facilityId}' and cr71a_date ge '${twoWeeksAgo}' and cr71a_date le '${endDate}' and cr71a_status ne ${BOOKING_STATUS_CODES.REJECTED} and statecode eq 0`,
          select: ['cr71a_date', 'cr71a_starttime', 'cr71a_endtime', 'cr71a_status', 'cr71a_username', 'cr71a_purpose'],
          top: 500,
        });

        if (result.data && result.data.length > 0) {
          for (const existing of result.data) {
            if (!existing.cr71a_starttime || !existing.cr71a_endtime) continue;

            const existingStart = new Date(existing.cr71a_starttime);
            const existingEnd = new Date(existing.cr71a_endtime);

            // Use robust dateTime overlap check
            if (checkDateTimeOverlap(requestedStartStr, requestedEndStr, existingStart, existingEnd)) {
              const startStr = format(existingStart, 'MMM dd, h:mm a');
              const endStr = format(existingEnd, 'MMM dd, h:mm a');
              throw new Error(
                `Already booked by ${existing.cr71a_username}: ${startStr} to ${endStr}.`
              );
            }
          }
        }
      } catch (err: any) {
        if (err.message?.includes('Already booked')) throw err;
        console.warn('Booking availability check encountered an error:', err);
        throw new Error(`Failed to verify booking availability: ${err.message}`);
      }
    },
    []
  );

  const createBooking = useCallback(async (
    bookingData: {
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
  ): Promise<string[]> => {
    try {
      if (!bookingData.userId) {
        throw new Error('User profile not found. Please reload the app.');
      }

      // Validate date and time range
      const endDate = bookingData.endDate || bookingData.date;
      if (endDate === bookingData.date && bookingData.startTime >= bookingData.endTime) {
        throw new Error('End time must be after the start time for same-day bookings.');
      }

      const isRecurring = recurrence?.type === 'weekly';
      const iterations = isRecurring ? recurrence!.weeks : 1;
      const seriesId = isRecurring ? crypto.randomUUID() : undefined;
      const createdIds: string[] = [];

      // ─────────────────────────────────────────────────────────────
      // TUTORIAL MODE INTERCEPTION
      // ─────────────────────────────────────────────────────────────
      if (isTutorialMode) {
        logTutorialOperation('CREATE_BOOKING', 'INTERCEPTED', {
          facility: bookingData.facilityId,
          date: bookingData.date,
          purpose: bookingData.purpose,
        });

        // Create mock bookings for each iteration
        for (let i = 0; i < iterations; i++) {
          const mockBookingDate = i === 0
            ? bookingData.date
            : format(addWeeks(parseISO(bookingData.date), i), 'yyyy-MM-dd');

          const mockId = generateMockBookingId();
          
          const demoBooking = createDemoBooking({
            id: mockId,
            facilityId: bookingData.facilityId,
            facilityName: 'Demo Facility', // Would be populated by actual facility lookup
            date: mockBookingDate,
            endDate: bookingData.endDate,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            purpose: bookingData.purpose,
            status: 'pending',
          });

          createdIds.push(mockId);
        }

        // Trigger UI update with demo bookings
        await loadBookings();
        logTutorialOperation('CREATE_BOOKING', 'EXECUTED', {
          count: createdIds.length,
          ids: createdIds,
          message: 'Demo bookings created in tutorial mode',
        });
        return createdIds;
      }

      // ─────────────────────────────────────────────────────────────
      // REAL BOOKING CREATION (Non-tutorial mode)
      // ─────────────────────────────────────────────────────────────
      for (let i = 0; i < iterations; i++) {
        const bookingDate = i === 0
          ? bookingData.date
          : format(addWeeks(parseISO(bookingData.date), i), 'yyyy-MM-dd');

        // Calculate end date for this iteration
        const baseDateObj = parseISO(bookingData.date);
        const baseEndDateObj = parseISO(bookingData.endDate || bookingData.date);
        const dayOffset = Math.floor((baseEndDateObj.getTime() - baseDateObj.getTime()) / (1000 * 60 * 60 * 24));
        const iterationEndDate = i === 0
          ? bookingData.endDate || bookingData.date
          : format(addWeeks(parseISO(bookingData.endDate || bookingData.date), i), 'yyyy-MM-dd');

        // Server-side duplicate check: verify availability for all dates in range
        const currentDateCheck = new Date(bookingDate + 'T00:00:00');
        const endDateCheck = new Date(iterationEndDate + 'T00:00:00');
        
        while (currentDateCheck <= endDateCheck) {
          const checkDateStr = format(currentDateCheck, 'yyyy-MM-dd');
          const isStartDate = checkDateStr === bookingDate;
          const isEndDate = checkDateStr === iterationEndDate;
          
          const checkStartTime = isStartDate ? bookingData.startTime : '08:00';
          const checkEndTime = isEndDate ? bookingData.endTime : '22:00';
          
          await validateBookingAvailability(bookingData.facilityId, bookingDate, bookingData.startTime, iterationEndDate, bookingData.endTime);
          currentDateCheck.setDate(currentDateCheck.getDate() + 1);
        }

        const startISO = new Date(`${bookingDate}T${bookingData.startTime}:00`).toISOString();
        const endISO = new Date(`${iterationEndDate}T${bookingData.endTime}:00`).toISOString();

        const payload: any = {
          cr71a_bookingpurpose: `${bookingData.userName} - ${bookingData.purpose}`.substring(0, 100),
          cr71a_date: bookingDate,
          cr71a_starttime: startISO,
          cr71a_endtime: endISO,
          cr71a_purpose: bookingData.purpose,
          cr71a_username: bookingData.userName,
          cr71a_useremail: bookingData.userEmail || '',
          cr71a_status: bookingData.autoApprove ? BOOKING_STATUS_CODES.APPROVED : BOOKING_STATUS_CODES.PENDING,
          cr71a_isrecurring: isRecurring,
          "cr71a_FacilityName@odata.bind": `/cr71a_facilities(${bookingData.facilityId})`,
          "cr71a_FullName@odata.bind": `/cr71a_profiles(${bookingData.userId})`,
        };

        if (isRecurring) {
          payload.cr71a_recurrencegroupid = seriesId;
          payload.cr71a_recurrencepattern = RECURRENCE_PATTERN.WEEKLY;
        }

        console.log('Booking create payload:', JSON.stringify(payload));
        const result = await Cr71a_bookingsService.create(payload as any);
        console.log('Booking create result:', JSON.stringify(result));
        if (!result.data) {
          console.error('Booking create returned no data:', result);
          throw new Error('Create returned no data - record may not have been created');
        }
        createdIds.push(result.data.cr71a_booking2id);
      }
      await loadBookings();
      return createdIds;
    } catch (err: any) {
      console.error('Failed to create booking:', err);
      setError(`Failed to create booking: ${err.message}`);
      throw err;
    }
  }, [loadBookings, validateBookingAvailability, isTutorialMode, createDemoBooking]);

  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    try {
      const currentBooking = bookings.find(b => b.id === id);
      if (currentBooking) {
        const allowed = VALID_TRANSITIONS[currentBooking.status];
        if (!allowed.includes(status)) {
          throw new Error(`Invalid status transition: ${currentBooking.status} → ${status}`);
        }
      }

      const dvStatus = STATUS_TO_DATAVERSE[status];
      await Cr71a_bookingsService.update(id, {
        cr71a_status: dvStatus as any,
      });
      await loadBookings();
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      setError(`Failed to update booking status: ${err.message}`);
      throw err;
    }
  }, [loadBookings, bookings]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      const payload: any = {};
      if (updates.status) payload.cr71a_status = STATUS_TO_DATAVERSE[updates.status] as any;
      if (updates.purpose) payload.cr71a_purpose = updates.purpose;
      if (updates.date) payload.cr71a_date = updates.date;
      if (updates.startTime) {
        const dateForTime = updates.date || bookings.find(b => b.id === id)?.date;
        if (!dateForTime) throw new Error('Cannot update start time: booking date not found');
        payload.cr71a_starttime = `${dateForTime}T${updates.startTime}:00Z`;
      }
      if (updates.endTime) {
        const dateForTime = updates.date || bookings.find(b => b.id === id)?.date;
        if (!dateForTime) throw new Error('Cannot update end time: booking date not found');
        payload.cr71a_endtime = `${dateForTime}T${updates.endTime}:00Z`;
      }
      
      await Cr71a_bookingsService.update(id, payload);
      await loadBookings();
    } catch (err: any) {
      console.error('Failed to update booking:', err);
      setError(`Failed to update booking: ${err.message}`);
      throw err;
    }
  }, [loadBookings, bookings]);
  
  const deleteBooking = useCallback(async (id: string) => {
    try {
      await Cr71a_bookingsService.delete(id);
      await loadBookings();
    } catch (err: any) {
      console.error('Failed to delete booking:', err);
      setError(`Failed to delete booking: ${err.message}`);
      throw err;
    }
  }, [loadBookings]);

  return { bookings, loading, error, createBooking, updateBookingStatus, updateBooking, deleteBooking, reload: loadBookings };
}
