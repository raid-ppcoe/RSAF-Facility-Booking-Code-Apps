import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facilityapproversService } from '../generated/services/Cr71a_facilityapproversService';
import type { FacilityApprover, Facility, UserRole } from '../types';

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
   * Check if a given user is allowed to approve bookings for a facility.
   * - super_admin: always true
   * - department_admins mode (default): admin whose dept matches facility's dept
   * - specific_approvers mode: user's profile or user's department is in approver list
   */
  const canUserApproveFacility = useCallback(
    (userId: string, userRole: UserRole, userDepartmentId: string | undefined, facility: Facility): boolean => {
      // Super admins can always approve
      if (userRole === 'super_admin') return true;

      // Only admins (and super admins, handled above) can approve
      if (userRole !== 'admin') return false;

      const mode = facility.approvalMode || 'department_admins';

      if (mode === 'department_admins') {
        // Default behavior: admin's department must match the facility's department
        return !!userDepartmentId && userDepartmentId === facility.departmentId;
      }

      // specific_approvers mode
      const facilityApprovers = approvers.filter((a) => a.facilityId === facility.id);

      // If no approvers configured, fall back to department-based
      if (facilityApprovers.length === 0) {
        return !!userDepartmentId && userDepartmentId === facility.departmentId;
      }

      return facilityApprovers.some((a) => {
        if (a.approverType === 'user') {
          return a.approverProfileId === userId;
        }
        if (a.approverType === 'department') {
          return !!userDepartmentId && a.approverDepartmentId === userDepartmentId;
        }
        return false;
      });
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
    reload: loadApprovers,
  };
}
