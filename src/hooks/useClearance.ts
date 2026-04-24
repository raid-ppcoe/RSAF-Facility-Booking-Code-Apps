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
    fieldsData?: Record<string, string>;
  }): Promise<string | undefined> => {
    try {
      const payload: any = {
        cr71a_fullname: data.fullName,
        cr71a_rank: data.rank,
        cr71a_phone: data.phone,
        cr71a_email: data.email,
        "cr71a_Booking@odata.bind": `/cr71a_booking2s(${data.bookingId})`,
      };
      // cr71a_fieldsdata may not exist in Dataverse yet — add it only if we have data,
      // and swallow any resulting 400 gracefully by catching in the outer try-catch.
      if (data.fieldsData) {
        payload.cr71a_fieldsdata = JSON.stringify(data.fieldsData);
      }

      try {
        const result = await Cr71a_clearancesService.create(payload);
        return result.data?.cr71a_clearanceid;
      } catch (err: any) {
        // If cr71a_fieldsdata column doesn't exist yet, retry without it
        if (payload.cr71a_fieldsdata !== undefined && err?.message?.includes('cr71a_fieldsdata')) {
          delete payload.cr71a_fieldsdata;
          const result = await Cr71a_clearancesService.create(payload);
          return result.data?.cr71a_clearanceid;
        }
        throw err;
      }
    } catch (err: any) {
      console.error('Failed to create clearance record:', err);
      throw new Error(`Failed to create clearance record: ${err.message}`);
    }
  }, []);

  const getClearanceByBookingId = useCallback(async (bookingId: string): Promise<ClearanceRecord | null> => {
    try {
      const filter = `_cr71a_booking_value eq '${bookingId}' and statecode eq 0`;

      // Fetch core fields and the optional fieldsdata column in parallel.
      // fieldsdata may not exist in Dataverse yet — we silently omit it if the query fails.
      const [mainResult, fieldsDataResult] = await Promise.allSettled([
        Cr71a_clearancesService.getAll({
          filter,
          select: [
            'cr71a_clearanceid',
            'cr71a_fullname',
            'cr71a_rank',
            'cr71a_phone',
            'cr71a_email',
            '_cr71a_booking_value',
          ],
          top: 1,
        }),
        Cr71a_clearancesService.getAll({
          filter,
          select: ['cr71a_clearanceid', 'cr71a_fieldsdata'],
          top: 1,
        }),
      ]);

      if (mainResult.status === 'rejected' || !mainResult.value.data?.length) return null;

      const c = mainResult.value.data[0];
      let fieldsData: Record<string, string> | undefined;
      if (fieldsDataResult.status === 'fulfilled' && fieldsDataResult.value.data?.length) {
        const raw = (fieldsDataResult.value.data[0] as any).cr71a_fieldsdata;
        if (raw) { try { fieldsData = JSON.parse(raw); } catch { /* ignore */ } }
      }

      return {
        id: c.cr71a_clearanceid,
        bookingId: (c as any)._cr71a_booking_value || bookingId,
        fullName: c.cr71a_fullname,
        rank: c.cr71a_rank,
        phone: c.cr71a_phone,
        email: c.cr71a_email,
        fieldsData,
      };
    } catch (err: any) {
      console.error('Failed to fetch clearance record:', err);
      return null;
    }
  }, []);

  return { createClearanceRecord, getClearanceByBookingId };
}
