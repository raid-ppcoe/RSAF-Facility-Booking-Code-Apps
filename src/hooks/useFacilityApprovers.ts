import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facilityapproversService } from '../generated/services/Cr71a_facilityapproversService';
import type { FacilityApprover, Facility, UserRole } from '../types';
import { isGlobalAdmin } from '../types';

const APPROVER_TYPE_USER = 406210000;
const APPROVER_TYPE_DEPARTMENT = 406210001;

export function useFacilityApprovers() {
  const [approvers, setApprovers] = useState<FacilityApprover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadApprovers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_facilityapproversService.getAll({
        select: [
          'cr71a_facilityapproverid',
          '_cr71a_facilityid_value',
          'cr71a_approvertype',
          '_cr71a_approverprofile_value',
          '_cr71a_approverdepartment_value',
          'cr71a_approverdisplayname',
        ],
        filter: 'statecode eq 0',
      });
      if (result.data) {
        setApprovers(
          result.data.map((a) => ({
            id: a.cr71a_facilityapproverid,
            facilityId: (a as any)._cr71a_facilityid_value || '',
            approverType: (a.cr71a_approvertype as number) === APPROVER_TYPE_DEPARTMENT ? 'department' : 'user',
            approverProfileId: (a as any)._cr71a_approverprofile_value || undefined,
            approverDepartmentId: (a as any)._cr71a_approverdepartment_value || undefined,
            displayName: a.cr71a_approverdisplayname || '',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load facility approvers:', err);
      setError(`Failed to load facility approvers: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovers();
  }, [loadApprovers]);

  const getApproversForFacility = useCallback(
    (facilityId: string) => approvers.filter((a) => a.facilityId === facilityId),
    [approvers]
  );

  const addApprover = useCallback(
    async (facilityId: string, type: 'user' | 'department', profileId?: string, departmentId?: string, displayName?: string) => {
      try {
        const payload: any = {
          'cr71a_FacilityId@odata.bind': `/cr71a_facilities(${facilityId})`,
          cr71a_approvertype: type === 'department' ? APPROVER_TYPE_DEPARTMENT : APPROVER_TYPE_USER,
          cr71a_approverdisplayname: displayName || '',
          statecode: 0,
        };
        if (type === 'user' && profileId) {
          payload['cr71a_ApproverProfile@odata.bind'] = `/cr71a_profiles(${profileId})`;
        }
        if (type === 'department' && departmentId) {
          payload['cr71a_ApproverDepartment@odata.bind'] = `/cr71a_departments(${departmentId})`;
        }
        await Cr71a_facilityapproversService.create(payload);
        await loadApprovers();
      } catch (err: any) {
        console.error('Failed to add facility approver:', err);
        throw new Error(err?.message || 'Failed to create approver record');
      }
    },
    [loadApprovers]
  );

  const removeApprover = useCallback(
    async (id: string) => {
      try {
        await Cr71a_facilityapproversService.delete(id);
        await loadApprovers();
      } catch (err: any) {
        console.error('Failed to remove facility approver:', err);
        throw err;
      }
    },
    [loadApprovers]
  );

  /**
   * Check if a given user is allowed to approve/manage a facility.
   * - global_admin: always true
   * - super_admin: true if facility is in their department OR they are explicitly tagged
   * - admin: true only if explicitly tagged as an approver
   * - user: always false
   */
  const canUserApproveFacility = useCallback(
    (userId: string, userRole: UserRole, facility: Facility, userDepartmentId?: string): boolean => {
      // Global admins can always approve
      if (isGlobalAdmin(userRole)) return true;

      // Only admins and super_admins can approve
      if (userRole !== 'admin' && userRole !== 'super_admin') return false;

      // Super admins can manage any facility in their department
      if (userRole === 'super_admin' && userDepartmentId && facility.departmentId === userDepartmentId) {
        return true;
      }

      // Check if user is explicitly tagged as an approver for this facility
      const facilityApprovers = approvers.filter((a) => a.facilityId === facility.id);
      return facilityApprovers.some((a) => {
        if (a.approverType === 'user') {
          return a.approverProfileId === userId;
        }
        return false;
      });
    },
    [approvers]
  );

  /**
   * Get all facility IDs that a user can manage.
   * - global_admin: ALL facility IDs
   * - super_admin: all facilities in their department + explicitly tagged facilities
   * - admin: only explicitly tagged facilities
   * - user: none
   */
  const getUserFacilityIds = useCallback(
    (userId: string, userRole: UserRole, allFacilities: Facility[], userDepartmentId?: string): Set<string> => {
      if (isGlobalAdmin(userRole)) {
        return new Set(allFacilities.map((f) => f.id));
      }
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return new Set<string>();
      }
      const ids = new Set<string>();
      // Super admins see all facilities in their department
      if (userRole === 'super_admin' && userDepartmentId) {
        for (const f of allFacilities) {
          if (f.departmentId === userDepartmentId) {
            ids.add(f.id);
          }
        }
      }
      // All admins/super_admins also see explicitly tagged facilities
      for (const a of approvers) {
        if (a.approverType === 'user' && a.approverProfileId === userId) {
          ids.add(a.facilityId);
        }
      }
      return ids;
    },
    [approvers]
  );

  return {
    approvers,
    loading,
    error,
    getApproversForFacility,
    addApprover,
    removeApprover,
    canUserApproveFacility,
    getUserFacilityIds,
    reload: loadApprovers,
  };
}
