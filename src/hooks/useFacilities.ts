import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facilitiesService } from '../generated/services/Cr71a_facilitiesService';
import type { Facility } from '../types';

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
          'cr71a_location',
          'cr71a_imageurl',
          'cr71a_maxrecurrenceweeks',
          'cr71a_allowedrecurrencepatterns',
          'cr71a_autoapproved',
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
            location: f.cr71a_location || '',
            image: f.cr71a_imageurl,
            maxRecurrenceWeeks: parseInt(f.cr71a_maxrecurrenceweeks || '4', 10),
            allowedRecurrencePatterns: f.cr71a_allowedrecurrencepatterns,
            autoApprove: f.cr71a_autoapproved === true,
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

  const createFacility = useCallback(async (facility: Omit<Facility, 'id'>) => {
    try {
      await Cr71a_facilitiesService.create({
        cr71a_facilityname: facility.name,
        'cr71a_DepartmentName@odata.bind': `/cr71a_departments(${facility.departmentId})`,
        cr71a_capacity: String(facility.capacity),
        cr71a_description: facility.description,
        cr71a_location: facility.location,
        cr71a_imageurl: facility.image,
        cr71a_maxrecurrenceweeks: String(facility.maxRecurrenceWeeks),
        cr71a_autoapproved: facility.autoApprove,
        statecode: 0,
      } as any);
      await loadFacilities();
    } catch (err: any) {
      console.error('Failed to create facility:', err);
      setError(`Failed to create facility: ${err.message}`);
    }
  }, [loadFacilities]);

  const updateFacility = useCallback(async (facility: Facility) => {
    try {
      await Cr71a_facilitiesService.update(facility.id, {
        cr71a_facilityname: facility.name,
        'cr71a_DepartmentName@odata.bind': `/cr71a_departments(${facility.departmentId})`,
        cr71a_capacity: String(facility.capacity),
        cr71a_description: facility.description,
        cr71a_location: facility.location,
        cr71a_imageurl: facility.image,
        cr71a_maxrecurrenceweeks: String(facility.maxRecurrenceWeeks),
        cr71a_autoapproved: facility.autoApprove,
      } as any);
      await loadFacilities();
    } catch (err: any) {
      console.error('Failed to update facility:', err);
      setError(`Failed to update facility: ${err.message}`);
    }
  }, [loadFacilities]);

  const deleteFacility = useCallback(async (id: string) => {
    try {
      await Cr71a_facilitiesService.delete(id);
      await loadFacilities();
    } catch (err: any) {
      console.error('Failed to delete facility:', err);
      setError(`Failed to delete facility: ${err.message}`);
    }
  }, [loadFacilities]);

  return { facilities, loading, error, createFacility, updateFacility, deleteFacility, reload: loadFacilities };
}
