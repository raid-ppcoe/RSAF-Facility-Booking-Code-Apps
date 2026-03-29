import { useState, useEffect } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';
import { Cr71a_userrolesService } from '../generated/services/Cr71a_userrolesService';
import type { User, UserRole } from '../types';

const DATAVERSE_TO_ROLE: Record<number, UserRole> = {
  406210000: 'user',
  406210001: 'admin',
  406210002: 'super_admin',
};

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      // Get the logged-in user's email from the Power Apps environment context
      const ctx = await getContext();
      const upn = ctx.user.userPrincipalName ?? '';

      if (!upn) {
        setError('Unable to determine logged-in user. Please reload the app.');
        setLoading(false);
        return;
      }

      // Escape single quotes for OData filter
      const safeUpn = upn.replace(/'/g, "''");

      const profileResult = await Cr71a_profilesService.getAll({
        select: ['cr71a_profileid', 'cr71a_fullname', 'cr71a_email', 'cr71a_phone'],
        filter: `cr71a_email eq '${safeUpn}' and statecode eq 0`,
        top: 1,
      });

      if (!profileResult.data || profileResult.data.length === 0) {
        setError(`No profile found for ${upn}. Please contact your administrator.`);
        setLoading(false);
        return;
      }

      const profile = profileResult.data[0];

      // Get user role for this profile
      const roleResult = await Cr71a_userrolesService.getAll({
        select: [
          'cr71a_userroleid',
          'cr71a_role',
          '_cr71a_fullname_value',
          '_cr71a_departmentname_value',
        ],
        filter: `_cr71a_fullname_value eq '${profile.cr71a_profileid}' and statecode eq 0`,
        top: 1,
      });

      let role: UserRole = 'user';
      let departmentId: string | undefined;

      if (roleResult.data && roleResult.data.length > 0) {
        const userRole = roleResult.data[0];
        role = DATAVERSE_TO_ROLE[userRole.cr71a_role as number] || 'user';
        departmentId = userRole._cr71a_departmentname_value || undefined;
      }

      setUser({
        id: profile.cr71a_profileid,
        name: profile.cr71a_fullname,
        email: profile.cr71a_email,
        phone: profile.cr71a_phone || '',
        role,
        departmentId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.cr71a_email}`,
      });
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(`Failed to load profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const updatePhone = async (phone: string) => {
    if (!user) return;
    try {
      await Cr71a_profilesService.update(user.id, { cr71a_phone: phone } as any);
      setUser(prev => prev ? { ...prev, phone } : prev);
    } catch (err: any) {
      console.error('Failed to update phone:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return { user, loading, error, isAuthenticated: !!user, logout, reload: loadProfile, updatePhone };
}
