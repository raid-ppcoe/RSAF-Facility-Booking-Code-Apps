import { useState, useEffect, useCallback } from 'react';
import { Cr71a_facility_locationsesService } from '../generated/services/Cr71a_facility_locationsesService';
import type { Location } from '../types';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_facility_locationsesService.getAll({
        select: ['cr71a_facility_locationsid', 'cr71a_location'],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_location asc'],
      });
      if (result.data) {
        setLocations(
          result.data.map((f) => ({
            id: f.cr71a_facility_locationsid,
            name: f.cr71a_location || '',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load locations:', err);
      setError(`Failed to load locations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const createLocation = useCallback(async (name: string) => {
    try {
      await Cr71a_facility_locationsesService.create({
        cr71a_location: name,
        statecode: 0,
      } as any);
      await loadLocations();
    } catch (err: any) {
      console.error('Failed to create location:', err);
      setError(`Failed to create location: ${err.message}`);
      throw err;
    }
  }, [loadLocations]);

  const updateLocation = useCallback(async (id: string, name: string) => {
    try {
      await Cr71a_facility_locationsesService.update(id, {
        cr71a_location: name,
      } as any);
      await loadLocations();
    } catch (err: any) {
      console.error('Failed to update location:', err);
      setError(`Failed to update location: ${err.message}`);
      throw err;
    }
  }, [loadLocations]);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      await Cr71a_facility_locationsesService.delete(id);
      await loadLocations();
    } catch (err: any) {
      console.error('Failed to delete location:', err);
      setError(`Failed to delete location: ${err.message}`);
      throw err;
    }
  }, [loadLocations]);

  return { locations, loading, error, createLocation, updateLocation, deleteLocation, reload: loadLocations };
}
