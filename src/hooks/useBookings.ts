import { useState, useEffect, useCallback } from 'react';
import { Cr71a_bookingsService } from '../generated/services/Cr71a_bookingsService';
import { Cr71a_booking2scr71a_status } from '../generated/models/Cr71a_bookingsModel';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';
import type { Booking, BookingStatus } from '../types';
import { addWeeks, format, parseISO } from 'date-fns';

const STATUS_TO_DATAVERSE: Record<BookingStatus, number> = {
  pending: 406210000,
  approved: 406210001,
  rejected: 406210002,
  cancelled: 406210002, // Dataverse has no Cancelled choice; maps to Rejected
};

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['approved', 'rejected'],
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
      if (result.data) {
        // Collect unique profile IDs to fetch phone numbers
        const profileIds = [...new Set(result.data.map(b => b._cr71a_fullname_value).filter(Boolean))] as string[];
        
        // Fetch phone numbers for all bookers in one batch
        let phoneMap = new Map<string, string>();
        if (profileIds.length > 0) {
          try {
            const profileResult = await Cr71a_profilesService.getAll({
              select: ['cr71a_profileid', 'cr71a_phone'],
              filter: 'statecode eq 0',
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

        setBookings(
          result.data.map((b) => ({
            id: b.cr71a_booking2id,
            facilityId: b._cr71a_facilityname_value || '',
            userId: b._cr71a_fullname_value || '',
            userName: b.cr71a_username || b.cr71a_bookingpurpose || '',
            userEmail: b.cr71a_useremail || '',
            userPhone: phoneMap.get(b._cr71a_fullname_value || '') || '',
            date: (b.cr71a_date || '').substring(0, 10),
            startTime: b.cr71a_starttime ? format(new Date(b.cr71a_starttime), 'HH:mm') : '',
            endTime: b.cr71a_endtime ? format(new Date(b.cr71a_endtime), 'HH:mm') : '',
            status: DATAVERSE_TO_STATUS[b.cr71a_status as number] || 'pending',
            purpose: b.cr71a_purpose || '',
            createdAt: b.createdon || '',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError(`Failed to load bookings: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const createBooking = useCallback(async (
    bookingData: {
      facilityId: string;
      userId: string;
      userName: string;
      date: string;
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

      const isRecurring = recurrence?.type === 'weekly';
      const iterations = isRecurring ? recurrence!.weeks : 1;
      const seriesId = isRecurring ? crypto.randomUUID() : undefined;
      const createdIds: string[] = [];

      for (let i = 0; i < iterations; i++) {
        const bookingDate = i === 0
          ? bookingData.date
          : format(addWeeks(parseISO(bookingData.date), i), 'yyyy-MM-dd');

        const startISO = new Date(`${bookingDate}T${bookingData.startTime}:00`).toISOString();
        const endISO = new Date(`${bookingDate}T${bookingData.endTime}:00`).toISOString();

        const payload: any = {
          cr71a_bookingpurpose: `${bookingData.userName} - ${bookingData.purpose}`.substring(0, 100),
          cr71a_date: bookingDate,
          cr71a_starttime: startISO,
          cr71a_endtime: endISO,
          cr71a_purpose: bookingData.purpose,
          cr71a_username: bookingData.userName,
          cr71a_status: bookingData.autoApprove ? 406210001 : 406210000,
          cr71a_isrecurring: isRecurring,
          "cr71a_FacilityName@odata.bind": `/cr71a_facilities(${bookingData.facilityId})`,
          "cr71a_FullName@odata.bind": `/cr71a_profiles(${bookingData.userId})`,
        };

        if (isRecurring) {
          payload.cr71a_recurrencegroupid = seriesId;
          payload.cr71a_recurrencepattern = 406210001; // Weekly
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
  }, [loadBookings]);

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
        payload.cr71a_starttime = new Date(`${dateForTime}T${updates.startTime}:00`).toISOString();
      }
      if (updates.endTime) {
        const dateForTime = updates.date || bookings.find(b => b.id === id)?.date;
        if (!dateForTime) throw new Error('Cannot update end time: booking date not found');
        payload.cr71a_endtime = new Date(`${dateForTime}T${updates.endTime}:00`).toISOString();
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
