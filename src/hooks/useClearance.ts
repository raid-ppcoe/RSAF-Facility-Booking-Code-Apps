import { useCallback } from 'react';
import { Cr71a_clearancesService } from '../generated/services/Cr71a_clearancesService';
import type { ClearanceRecord } from '../types';

export function useClearance() {
  const createClearanceRecord = useCallback(async (data: {
    bookingId: string;
    fullName: string;
    rank: string;
    phone: string;
    email: string;
  }): Promise<string | undefined> => {
    try {
      const payload: any = {
        cr71a_fullname: data.fullName,
        cr71a_rank: data.rank,
        cr71a_phone: data.phone,
        cr71a_email: data.email,
        "cr71a_Booking@odata.bind": `/cr71a_booking2s(${data.bookingId})`,
      };

      const result = await Cr71a_clearancesService.create(payload);
      return result.data?.cr71a_clearanceid;
    } catch (err: any) {
      console.error('Failed to create clearance record:', err);
      throw new Error(`Failed to create clearance record: ${err.message}`);
    }
  }, []);

  const getClearanceByBookingId = useCallback(async (bookingId: string): Promise<ClearanceRecord | null> => {
    try {
      const result = await Cr71a_clearancesService.getAll({
        filter: `_cr71a_booking_value eq '${bookingId}' and statecode eq 0`,
        select: [
          'cr71a_clearanceid',
          'cr71a_fullname',
          'cr71a_rank',
          'cr71a_phone',
          'cr71a_email',
          '_cr71a_booking_value',
        ],
        top: 1,
      });

      if (result.data && result.data.length > 0) {
        const c = result.data[0];
        return {
          id: c.cr71a_clearanceid,
          bookingId: (c as any)._cr71a_booking_value || bookingId,
          fullName: c.cr71a_fullname,
          rank: c.cr71a_rank,
          phone: c.cr71a_phone,
          email: c.cr71a_email,
        };
      }
      return null;
    } catch (err: any) {
      console.error('Failed to fetch clearance record:', err);
      return null;
    }
  }, []);

  return { createClearanceRecord, getClearanceByBookingId };
}
