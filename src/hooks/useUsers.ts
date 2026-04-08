import { useState, useEffect, useCallback, useRef } from 'react';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';
import { Cr71a_userrolesService } from '../generated/services/Cr71a_userrolesService';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string | null;
  roleName: string | null;
  departmentId: string | null;
  userRoleId?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const usersRef = useRef<User[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all user roles to map to profiles
      const rolesResult = await Cr71a_userrolesService.getAll({
        select: [
          'cr71a_userroleid', 
          'cr71a_role', 
          '_cr71a_fullname_value', 
          '_cr71a_departmentname_value'
        ],
        filter: 'statecode eq 0',
      });
      const fetchedRoles = rolesResult.data || [];
      
      const DATAVERSE_TO_ROLE: Record<number, string> = {
        406210000: 'user',
        406210001: 'admin',
        406210002: 'super_admin',
        406210003: 'global_admin',
      };

      // Map unique roles for the UI dropdown
      const uniqueRoles = Object.entries(DATAVERSE_TO_ROLE).map(([val, label]) => ({
        id: val,
        name: label
      }));
      setRoles(uniqueRoles);

      const userRoleMap = new Map(fetchedRoles.map(r => [
        r._cr71a_fullname_value, 
        {
          roleId: String(r.cr71a_role),
          roleName: DATAVERSE_TO_ROLE[r.cr71a_role as number] || 'user',
          departmentId: r._cr71a_departmentname_value || null,
          userRoleId: r.cr71a_userroleid
        }
      ]));

      const profilesResult = await Cr71a_profilesService.getAll({
        select: [
          'cr71a_profileid',
          'cr71a_fullname',
          'cr71a_email',
          'cr71a_phone'
        ],
        filter: 'statecode eq 0',
      });

      if (profilesResult.data) {
        setUsers(profilesResult.data.map(p => {
          const roleInfo = userRoleMap.get(p.cr71a_profileid);
          return {
            id: p.cr71a_profileid,
            name: p.cr71a_fullname || '',
            email: p.cr71a_email || '',
            phone: p.cr71a_phone || '',
            roleId: roleInfo?.roleId || null,
            roleName: roleInfo?.roleName || null,
            departmentId: roleInfo?.departmentId || null,
            userRoleId: roleInfo?.userRoleId // keep this to update the role
          };
        }));
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUserRole = useCallback(async (userId: string, roleId: string) => {
    try {
      // Find the user to get their userRoleId, since we store the role on userroles table
      const targetUser = usersRef.current.find(u => u.id === userId);
      // Depending on structure, you would update the userrole record
      // If user has a userRoleId, we update that record's cr71a_role
      if (targetUser?.userRoleId) {
         await Cr71a_userrolesService.update(targetUser.userRoleId, {
           cr71a_role: parseInt(roleId, 10)
         } as any);
      } else {
         // Create a new role record if the user doesn't have one
         await Cr71a_userrolesService.create({
           "cr71a_FullName@odata.bind": `/cr71a_profiles(${userId})`,
           cr71a_role: parseInt(roleId, 10) as any,
           cr71a_userrolename: 'User Role'
         } as any);
      }
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      throw err;
    }
  }, [loadUsers]);

  const createUser = useCallback(async (name: string, email: string, departmentId: string, roleId: string, phone?: string) => {
    try {
      // Step 1: Create the profile record
      const profileResult = await Cr71a_profilesService.create({
        cr71a_fullname: name,
        cr71a_email: email,
        ...(phone ? { cr71a_phone: phone } : {}),
        statecode: 0,
      } as any);

      const newProfileId = profileResult.data?.cr71a_profileid;
      if (!newProfileId) {
        throw new Error('Failed to create profile — no ID returned');
      }

      // Step 2: Create the user role record linked to the new profile and department
      await Cr71a_userrolesService.create({
        "cr71a_FullName@odata.bind": `/cr71a_profiles(${newProfileId})`,
        "cr71a_DepartmentName@odata.bind": `/cr71a_departments(${departmentId})`,
        cr71a_role: parseInt(roleId, 10) as any,
        cr71a_userrolename: 'User Role',
      } as any);

      await loadUsers();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      throw err;
    }
  }, [loadUsers]);

  const updateUser = useCallback(async (userId: string, data: { name: string; email: string; phone?: string; departmentId: string; roleId: string }) => {
    try {
      // Update profile fields (name, email, phone)
      await Cr71a_profilesService.update(userId, {
        cr71a_fullname: data.name,
        cr71a_email: data.email,
        cr71a_phone: data.phone || '',
      } as any);

      // Find the user to get their userRoleId
      const targetUser = usersRef.current.find(u => u.id === userId);

      if (targetUser?.userRoleId) {
        // Update existing user role record (role + department)
        await Cr71a_userrolesService.update(targetUser.userRoleId, {
          cr71a_role: parseInt(data.roleId, 10),
          "cr71a_DepartmentName@odata.bind": `/cr71a_departments(${data.departmentId})`,
        } as any);
      } else {
        // Create a new role record if the user doesn't have one
        await Cr71a_userrolesService.create({
          "cr71a_FullName@odata.bind": `/cr71a_profiles(${userId})`,
          "cr71a_DepartmentName@odata.bind": `/cr71a_departments(${data.departmentId})`,
          cr71a_role: parseInt(data.roleId, 10) as any,
          cr71a_userrolename: 'User Role',
        } as any);
      }

      await loadUsers();
    } catch (err: any) {
      console.error('Failed to update user:', err);
      throw err;
    }
  }, [loadUsers]);

  const checkEmailExists = useCallback(async (email: string, excludeUserId?: string) => {
    try {
      const result = await Cr71a_profilesService.getAll({
        select: ['cr71a_profileid', 'cr71a_fullname', 'cr71a_email'],
        filter: `cr71a_email eq '${email.replace(/'/g, "''")}'`,
      });

      if (result.data && result.data.length > 0) {
        const profile = result.data[0];
        // If excludeUserId is provided and matches, this is the user editing themselves (not a duplicate)
        if (excludeUserId && profile.cr71a_profileid === excludeUserId) {
          return null;
        }
        return profile;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to check email:', err);
      throw err;
    }
  }, []);

  return { users, roles, loading, error, updateUserRole, createUser, updateUser, checkEmailExists, reload: loadUsers };
}
