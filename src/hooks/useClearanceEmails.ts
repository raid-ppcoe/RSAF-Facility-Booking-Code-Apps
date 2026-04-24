import { useCallback } from 'react';
import { Cr71a_clearanceemailsService } from '../generated/services/Cr71a_clearanceemailsService';

export interface ClearanceEmailRecipient {
  email: string;
  displayName: string;
}

export function useClearanceEmails() {
  const getClearanceEmailsForFacility = useCallback(
    async (facilityId: string): Promise<ClearanceEmailRecipient[]> => {
      try {
        const result = await Cr71a_clearanceemailsService.getAll({
          filter: `_cr71a_facility_value eq '${facilityId}' and statecode eq 0`,
          select: ['cr71a_clearanceemailid', 'cr71a_email', 'cr71a_displayname'],
        });
        if (!result.data) return [];
        return result.data.map((r) => ({
          email: r.cr71a_email,
          displayName: r.cr71a_displayname || r.cr71a_email,
        }));
      } catch (err) {
        console.error('Failed to fetch clearance emails:', err);
        return [];
      }
    },
    []
  );

  return { getClearanceEmailsForFacility };
}
