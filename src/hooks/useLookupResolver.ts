import { useState, useCallback, useRef } from 'react';
import { Cr71a_departmentsService } from '../generated/services/Cr71a_departmentsService';
import { Cr71a_facilitiesService } from '../generated/services/Cr71a_facilitiesService';
import { Cr71a_profilesService } from '../generated/services/Cr71a_profilesService';

interface ResolvedCache {
  [key: string]: string;
}

export function useLookupResolver() {
  const departmentCache = useRef<ResolvedCache>({});
  const facilityCache = useRef<ResolvedCache>({});
  const profileCache = useRef<ResolvedCache>({});

  const resolveDepartment = useCallback(async (guid: string): Promise<string> => {
    if (!guid) return '';
    if (departmentCache.current[guid]) return departmentCache.current[guid];
    try {
      const result = await Cr71a_departmentsService.get(guid, {
        select: ['cr71a_departmentname'],
      });
      const name = result.data?.cr71a_departmentname || '';
      departmentCache.current[guid] = name;
      return name;
    } catch (err) {
      console.error('Failed to resolve department:', guid, err);
      return '';
    }
  }, []);

  const resolveFacility = useCallback(async (guid: string): Promise<string> => {
    if (!guid) return '';
    if (facilityCache.current[guid]) return facilityCache.current[guid];
    try {
      const result = await Cr71a_facilitiesService.get(guid, {
        select: ['cr71a_facilityname'],
      });
      const name = result.data?.cr71a_facilityname || '';
      facilityCache.current[guid] = name;
      return name;
    } catch (err) {
      console.error('Failed to resolve facility:', guid, err);
      return '';
    }
  }, []);

  const resolveProfile = useCallback(async (guid: string): Promise<string> => {
    if (!guid) return '';
    if (profileCache.current[guid]) return profileCache.current[guid];
    try {
      const result = await Cr71a_profilesService.get(guid, {
        select: ['cr71a_fullname'],
      });
      const name = result.data?.cr71a_fullname || '';
      profileCache.current[guid] = name;
      return name;
    } catch (err) {
      console.error('Failed to resolve profile:', guid, err);
      return '';
    }
  }, []);

  return { resolveDepartment, resolveFacility, resolveProfile };
}
