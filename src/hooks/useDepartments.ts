import { useState, useEffect, useCallback } from 'react';
import { Cr71a_departmentsService } from '../generated/services/Cr71a_departmentsService';
import type { Department } from '../types';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_departmentsService.getAll({
        select: ['cr71a_departmentid', 'cr71a_departmentname'],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_departmentname asc'],
      });
      if (result.data) {
        setDepartments(
          result.data.map((d) => ({
            id: d.cr71a_departmentid,
            name: d.cr71a_departmentname,
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load departments:', err);
      setError(`Failed to load departments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const createDepartment = useCallback(async (name: string, description: string = '') => {
    try {
      const payload: any = {
        cr71a_departmentname: name,
        statecode: 0,
      };
      if (description) {
        payload.cr71a_label = description;
      }
      await Cr71a_departmentsService.create(payload);
      await loadDepartments();
    } catch (err: any) {
      console.error('Failed to create department:', err);
      setError(`Failed to create department: ${err.message}`);
      throw err;
    }
  }, [loadDepartments]);

  const updateDepartment = useCallback(async (id: string, name: string, description: string = '') => {
    try {
      const payload: any = {
        cr71a_departmentname: name,
      };
      if (description) {
        payload.cr71a_label = description;
      }
      await Cr71a_departmentsService.update(id, payload);
      await loadDepartments();
    } catch (err: any) {
      console.error('Failed to update department:', err);
      setError(`Failed to update department: ${err.message}`);
      throw err;
    }
  }, [loadDepartments]);

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await Cr71a_departmentsService.delete(id);
      await loadDepartments();
    } catch (err: any) {
      console.error('Failed to delete department:', err);
      setError(`Failed to delete department: ${err.message}`);
      throw err;
    }
  }, [loadDepartments]);

  return { departments, loading, error, createDepartment, updateDepartment, deleteDepartment, reload: loadDepartments };
}
