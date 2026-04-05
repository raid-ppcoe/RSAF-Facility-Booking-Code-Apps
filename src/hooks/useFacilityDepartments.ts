import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facilitydepartmentsService } from '../generated/services/Cr71a_facilitydepartmentsService';
import type { FacilityDepartment, Facility } from '../types';

export function useFacilityDepartments() {
  const [facilityDepartments, setFacilityDepartments] = useState<FacilityDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilityDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_facilitydepartmentsService.getAll({
        select: [
          'cr71a_facilitydepartmentid',
          '_cr71a_cr71a_facilityid_value',
          '_cr71a_cr71a_departmentid_value',
        ],
        filter: 'statecode eq 0',
      });
      if (result.data) {
        setFacilityDepartments(
          result.data.map((fd) => ({
            id: fd.cr71a_facilitydepartmentid,
            facilityId: (fd as any)._cr71a_cr71a_facilityid_value || '',
            departmentId: (fd as any)._cr71a_cr71a_departmentid_value || '',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load facility departments:', err);
      setError(`Failed to load facility departments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFacilityDepartments();
  }, [loadFacilityDepartments]);

  const getDepartmentsForFacility = useCallback(
    (facilityId: string) => facilityDepartments.filter((fd) => fd.facilityId === facilityId),
    [facilityDepartments]
  );

  const addFacilityDepartment = useCallback(
    async (facilityId: string, departmentId: string) => {
      try {
        const payload: any = {
          'cr71a_cr71a_FacilityId@odata.bind': `/cr71a_facilities(${facilityId})`,
          'cr71a_cr71a_DepartmentId@odata.bind': `/cr71a_departments(${departmentId})`,
          cr71a_facilitydepartmentname: 'FacilityDepartment',
          statecode: 0,
        };
        await Cr71a_facilitydepartmentsService.create(payload);
        await loadFacilityDepartments();
      } catch (err: any) {
        console.error('Failed to add facility department:', err);
        throw err;
      }
    },
    [loadFacilityDepartments]
  );

  const removeFacilityDepartment = useCallback(
    async (id: string) => {
      try {
        await Cr71a_facilitydepartmentsService.delete(id);
        await loadFacilityDepartments();
      } catch (err: any) {
        console.error('Failed to remove facility department:', err);
        throw err;
      }
    },
    [loadFacilityDepartments]
  );

  /**
   * Returns the list of facilities visible to a given department.
   * - If a facility has NO department restrictions, it is visible to everyone.
   * - If a facility has restrictions, only assigned departments (+ the owning department) can see it.
   * - Super admins should bypass this filter at the component level.
   */
  const getVisibleFacilities = useCallback(
    (facilities: Facility[], userDepartmentId: string | undefined): Facility[] => {
      if (!userDepartmentId) return facilities;
      return facilities.filter((f) => {
        const assignments = facilityDepartments.filter((fd) => fd.facilityId === f.id);
        // No restrictions = visible to all
        if (assignments.length === 0) return true;
        // Owning department always has access
        if (f.departmentId === userDepartmentId) return true;
        // Check if user's department is explicitly assigned
        return assignments.some((fd) => fd.departmentId === userDepartmentId);
      });
    },
    [facilityDepartments]
  );

  return {
    facilityDepartments,
    loading,
    error,
    getDepartmentsForFacility,
    addFacilityDepartment,
    removeFacilityDepartment,
    getVisibleFacilities,
    reload: loadFacilityDepartments,
  };
}
