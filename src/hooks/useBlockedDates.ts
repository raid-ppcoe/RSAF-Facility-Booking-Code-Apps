import { useState, useEffect, useCallback } from 'react';
import { Cr71a_blockeddatesService } from '../generated/services/Cr71a_blockeddatesService';
import type { BlackoutPeriod } from '../types';

export function useBlockedDates() {
  const [blackouts, setBlackouts] = useState<BlackoutPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBlackouts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_blockeddatesService.getAll({
        select: [
          'cr71a_blockeddateid',
          'cr71a_reason',
          '_cr71a_facilityname_value',
          'cr71a_startdate',
          'cr71a_enddate',
          'cr71a_starttime',
          'cr71a_endtime',
          '_cr71a_createdby_value',
          'cr71a_isfullday',
        ],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_startdate desc'],
      });
      if (result.data) {
        setBlackouts(
          result.data.map((b) => ({
            id: b.cr71a_blockeddateid,
            facilityId: b._cr71a_facilityname_value || null,
            startDate: (b.cr71a_startdate || '').split('T')[0],
            endDate: (b.cr71a_enddate || '').split('T')[0],
            startTime: b.cr71a_starttime?.includes('T') ? b.cr71a_starttime.split('T')[1]?.slice(0, 5) : b.cr71a_starttime,
            endTime: b.cr71a_endtime?.includes('T') ? b.cr71a_endtime.split('T')[1]?.slice(0, 5) : b.cr71a_endtime,
            reason: b.cr71a_reason,
            createdBy: b._cr71a_createdby_value || '',
            isFullDay: b.cr71a_isfullday === (1 as any) || b.cr71a_isfullday === (true as any),
            isGlobal: !b._cr71a_facilityname_value,
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load blackouts:', err);
      setError(`Failed to load blackouts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlackouts();
  }, [loadBlackouts]);

  const createBlackout = useCallback(async (blackout: Omit<BlackoutPeriod, 'id'>) => {
    try {
      const record: any = {
        cr71a_reason: blackout.reason,
        cr71a_startdate: blackout.startDate,
        cr71a_enddate: blackout.endDate,
        cr71a_isfullday: blackout.isFullDay as any,
        statecode: 0,
      };
      if (blackout.startTime) record.cr71a_starttime = blackout.startTime;
      if (blackout.endTime) record.cr71a_endtime = blackout.endTime;
      if (blackout.facilityId) {
        record['cr71a_FacilityName@odata.bind'] = `/cr71a_facilities(${blackout.facilityId})`;
      }
      if (blackout.createdBy) {
        record['cr71a_CreatedBy@odata.bind'] = `/cr71a_profiles(${blackout.createdBy})`;
      }
      const result = await Cr71a_blockeddatesService.create(record);
      if (!result.success) {
        throw new Error(result.error?.message || 'Dataverse server rejected the blackout creation (Unknown Error).');
      }
      await loadBlackouts();
    } catch (err: any) {
      console.error('Failed to create blackout:', err);
      setError(`Failed to create blackout: ${err.message}`);
      throw err;
    }
  }, [loadBlackouts]);

  const updateBlackout = useCallback(async (id: string, blackout: Partial<Omit<BlackoutPeriod, 'id'>>) => {
    try {
      const record: any = {};
      if (blackout.reason !== undefined) record.cr71a_reason = blackout.reason;
      if (blackout.startDate !== undefined) record.cr71a_startdate = blackout.startDate;
      if (blackout.endDate !== undefined) record.cr71a_enddate = blackout.endDate;
      if (blackout.isFullDay !== undefined) record.cr71a_isfullday = blackout.isFullDay as any;
      if (blackout.startTime !== undefined) record.cr71a_starttime = blackout.startTime;
      if (blackout.endTime !== undefined) record.cr71a_endtime = blackout.endTime;
      
      if (blackout.facilityId !== undefined) {
        if (blackout.facilityId) {
          record['cr71a_FacilityName@odata.bind'] = `/cr71a_facilities(${blackout.facilityId})`;
        } else {
          // Binding to null handled contextually by framework if required.
        }
      }
      
      await Cr71a_blockeddatesService.update(id, record);
      await loadBlackouts();
    } catch (err: any) {
      console.error('Failed to update blackout:', err);
      setError(`Failed to update blackout: ${err.message}`);
      throw err;
    }
  }, [loadBlackouts]);

  const deleteBlackout = useCallback(async (id: string) => {
    try {
      await Cr71a_blockeddatesService.delete(id);
      await loadBlackouts();
    } catch (err: any) {
      console.error('Failed to delete blackout:', err);
      setError(`Failed to delete blackout: ${err.message}`);
      throw err;
    }
  }, [loadBlackouts]);

  return { blackouts, loading, error, createBlackout, updateBlackout, deleteBlackout, reload: loadBlackouts };
}
