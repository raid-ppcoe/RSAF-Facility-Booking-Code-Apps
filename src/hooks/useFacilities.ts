import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facilitiesService } from '../generated/services/Cr71a_facilitiesService';
import type { Facility, ApprovalMode } from '../types';

const APPROVAL_MODE_MAP: Record<number, ApprovalMode> = {
  406210000: 'department_admins',
  406210001: 'specific_approvers',
};
const APPROVAL_MODE_REVERSE: Record<string, number> = {
  department_admins: 406210000,
  specific_approvers: 406210001,
};

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_facilitiesService.getAll({
        select: [
          'cr71a_facilityid',
          'cr71a_facilityname',
          '_cr71a_departmentname_value',
          'cr71a_capacity',
          'cr71a_description',
          '_cr71a_location_value',
          'cr71a_imageurl',
          'cr71a_maxrecurrenceweeks',
          'cr71a_allowedrecurrencepatterns',
          'cr71a_autoapproved',
          'cr71a_approvalmode',
        ],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_facilityname asc'],
      });
      console.log('Raw facilities response:', JSON.stringify(result));
      if (result.data) {
        console.log('Facility IDs returned:', result.data.map((f) => ({ id: f.cr71a_facilityid, name: f.cr71a_facilityname })));
        setFacilities(
          result.data.map((f) => ({
            id: f.cr71a_facilityid,
            name: f.cr71a_facilityname,
            departmentId: f._cr71a_departmentname_value || '',
            capacity: parseInt(f.cr71a_capacity || '0', 10),
            description: f.cr71a_description || '',
            locationId: f._cr71a_location_value || '',
            image: f.cr71a_imageurl,
            maxRecurrenceWeeks: parseInt(f.cr71a_maxrecurrenceweeks || '4', 10),
            allowedRecurrencePatterns: f.cr71a_allowedrecurrencepatterns,
            autoApprove: (f.cr71a_autoapproved as any) === true || f.cr71a_autoapproved === 1,
            approvalMode: APPROVAL_MODE_MAP[(f as any).cr71a_approvalmode as number] || 'department_admins',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load facilities:', err);
      setError(`Failed to load facilities: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const createFacility = useCallback(async (facility: Omit<Facility, 'id'>): Promise<string | undefined> => {
    try {
      const payload: any = {
        cr71a_facilityname: facility.name,
        'cr71a_DepartmentName@odata.bind': `/cr71a_departments(${facility.departmentId})`,
        cr71a_capacity: String(facility.capacity),
        cr71a_description: facility.description,
        cr71a_maxrecurrenceweeks: String(facility.maxRecurrenceWeeks),
        cr71a_autoapproved: !!facility.autoApprove,
        cr71a_approvalmode: APPROVAL_MODE_REVERSE[facility.approvalMode || 'department_admins'],
        statecode: 0,
      };
      if (facility.locationId) {
        payload['cr71a_location@odata.bind'] = `/cr71a_facility_locationses(${facility.locationId})`;
      }
      if (facility.image) {
        payload.cr71a_imageurl = facility.image;
      }
      const result = await Cr71a_facilitiesService.create(payload);
      const newId = result.data?.cr71a_facilityid;
      await loadFacilities();
      return newId;
    } catch (err: any) {
      console.error('Failed to create facility:', err);
      setError(`Failed to create facility: ${err.message}`);
      return undefined;
    }
  }, [loadFacilities]);

  const updateFacility = useCallback(async (facility: Facility) => {
    try {
      const payload: any = {
        cr71a_facilityname: facility.name,
        'cr71a_DepartmentName@odata.bind': `/cr71a_departments(${facility.departmentId})`,
        cr71a_capacity: String(facility.capacity),
        cr71a_description: facility.description,
        cr71a_maxrecurrenceweeks: String(facility.maxRecurrenceWeeks),
        cr71a_autoapproved: !!facility.autoApprove,
        cr71a_approvalmode: APPROVAL_MODE_REVERSE[facility.approvalMode || 'department_admins'],
      };
      if (facility.locationId) {
        payload['cr71a_location@odata.bind'] = `/cr71a_facility_locationses(${facility.locationId})`;
      }
      if (facility.image) {
        payload.cr71a_imageurl = facility.image;
      }
      await Cr71a_facilitiesService.update(facility.id, payload);
      await loadFacilities();
    } catch (err: any) {
      console.error('Failed to update facility:', err);
      setError(`Failed to update facility: ${err.message}`);
    }
  }, [loadFacilities]);

  const deleteFacility = useCallback(async (id: string, hasBookings: boolean = false) => {
    try {
      if (hasBookings) {
        // Soft delete by setting statecode to Inactive (1) and statuscode to Inactive (2)
        await Cr71a_facilitiesService.update(id, {
          statecode: 1,
          statuscode: 2,
        } as any);
      } else {
        await Cr71a_facilitiesService.delete(id);
      }
      await loadFacilities();
    } catch (err: any) {
      console.error('Failed to delete facility:', err);
      setError(`Failed to delete facility: ${err.message}`);
    }
  }, [loadFacilities]);

  return { facilities, loading, error, createFacility, updateFacility, deleteFacility, reload: loadFacilities };
}
