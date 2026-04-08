import { useState, useEffect } from 'react';
import { getContext } from '@microsoft/power-apps/app';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';
import { Cr71a_userrolesService } from '../generated/services/Cr71a_userrolesService';
import type { User, UserRole } from '../types';

const DATAVERSE_TO_ROLE: Record<number, UserRole> = {
  406210000: 'user',
  406210001: 'admin',
  406210002: 'super_admin',
  406210003: 'global_admin',
};

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noProfile, setNoProfile] = useState(false);
  const [envEmail, setEnvEmail] = useState('');
  const [envDisplayName, setEnvDisplayName] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    setNoProfile(false);
    try {
      // Get the logged-in user's email from the Power Apps environment context
      const ctx = await getContext();
      const upn = ctx.user.userPrincipalName ?? '';
      const displayName = (ctx.user as any).displayName ?? '';

      setEnvEmail(upn);
      setEnvDisplayName(displayName);

      if (!upn) {
        setError('Unable to determine logged-in user. Please reload the app.');
        setLoading(false);
        return;
      }

      // Escape single quotes for OData filter
      const safeUpn = upn.replace(/'/g, "''");

      const profileResult = await Cr71a_profilesService.getAll({
        select: ['cr71a_profileid', 'cr71a_fullname', 'cr71a_email', 'cr71a_phone', 'cr71a_tutorialrole'],
        filter: `cr71a_email eq '${safeUpn}' and statecode eq 0`,
        top: 1,
      });

      if (!profileResult.data || profileResult.data.length === 0) {
        setNoProfile(true);
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
        tutorialRole: profile.cr71a_tutorialrole != null ? (DATAVERSE_TO_ROLE[profile.cr71a_tutorialrole as number] || undefined) : undefined,
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

  const updateName = async (name: string) => {
    if (!user) return;
    try {
      await Cr71a_profilesService.update(user.id, { cr71a_fullname: name } as any);
      setUser(prev => prev ? { ...prev, name } : prev);
    } catch (err: any) {
      console.error('Failed to update name:', err);
      throw err;
    }
  };

  const ROLE_TO_DATAVERSE: Record<string, number> = {
    user: 406210000,
    admin: 406210001,
    super_admin: 406210002,
    global_admin: 406210003,
  };

  const updateTutorialRole = async (tutorialRole: string) => {
    if (!user) return;
    try {
      const dv = ROLE_TO_DATAVERSE[tutorialRole];
      await Cr71a_profilesService.update(user.id, { cr71a_tutorialrole: dv } as any);
      setUser(prev => prev ? { ...prev, tutorialRole: tutorialRole as any } : prev);
    } catch (err: any) {
      console.error('Failed to update tutorial role:', err);
    }
  };

  const register = async (data: { fullName: string; phone: string; departmentId: string }) => {
    try {
      // Step 1: Create the profile record
      const profileResult = await Cr71a_profilesService.create({
        cr71a_fullname: data.fullName,
        cr71a_email: envEmail,
        cr71a_phone: data.phone,
        statecode: 0,
      } as any);

      const newProfileId = profileResult.data?.cr71a_profileid;
      if (!newProfileId) {
        throw new Error('Failed to create profile — no ID returned');
      }

      // Step 2: Create the user role record linked to the new profile and department (default role: user = 406210000)
      await Cr71a_userrolesService.create({
        "cr71a_FullName@odata.bind": `/cr71a_profiles(${newProfileId})`,
        "cr71a_DepartmentName@odata.bind": `/cr71a_departments(${data.departmentId})`,
        cr71a_role: 406210000 as any,
        cr71a_userrolename: 'User Role',
      } as any);

      // Step 3: Reload the profile so the user is logged in
      setNoProfile(false);
      await loadProfile();
    } catch (err: any) {
      console.error('Failed to register:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    window.location.reload();
  };

  return { user, loading, error, isAuthenticated: !!user, logout, reload: loadProfile, updatePhone, updateName, updateTutorialRole, noProfile, envEmail, envDisplayName, register };
}
