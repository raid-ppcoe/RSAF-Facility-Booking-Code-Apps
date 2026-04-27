import { useCallback } from 'react';
import { Cr71a_clearanceemailsService } from '../generated/services/Cr71a_clearanceemailsService';

export interface ClearanceEmailRecipient {
  id: string;
  email: string;
  displayName: string;
}

export interface ClearanceEmailSuggestion {
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
          id: r.cr71a_clearanceemailid,
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

  // Suggestion pool: every email ever added (active OR soft-deleted), deduped.
  // Soft delete keeps removed emails in this pool so admins editing other facilities
  // can still pick them from autocomplete.
  const getAllKnownEmails = useCallback(async (): Promise<ClearanceEmailSuggestion[]> => {
    try {
      const result = await Cr71a_clearanceemailsService.getAll({
        select: ['cr71a_clearanceemailid', 'cr71a_email', 'cr71a_displayname'],
      });
      if (!result.data) return [];
      const seen = new Map<string, ClearanceEmailSuggestion>();
      for (const r of result.data) {
        const key = (r.cr71a_email || '').toLowerCase().trim();
        if (!key) continue;
        if (!seen.has(key)) {
          seen.set(key, { email: r.cr71a_email, displayName: r.cr71a_displayname || r.cr71a_email });
        }
      }
      return Array.from(seen.values()).sort((a, b) => a.email.localeCompare(b.email));
    } catch (err) {
      console.error('Failed to fetch all clearance emails:', err);
      return [];
    }
  }, []);

  // Add or reactivate a recipient. If there's already a record for this facility+email
  // (regardless of state), reactivate it instead of creating a duplicate.
  const addClearanceEmail = useCallback(
    async (data: { facilityId: string; email: string; displayName?: string }): Promise<string | undefined> => {
      const email = data.email.trim();
      const displayName = (data.displayName || email).trim();

      // Look for an existing record for this facility + email (any state)
      try {
        const existing = await Cr71a_clearanceemailsService.getAll({
          filter: `_cr71a_facility_value eq '${data.facilityId}' and cr71a_email eq '${email.replace(/'/g, "''")}'`,
          select: ['cr71a_clearanceemailid', 'statecode'],
          top: 1,
        });
        const existingRecord = existing.data?.[0];
        if (existingRecord) {
          // Reactivate (and refresh display name) so re-adding a previously removed
          // recipient picks up where it left off rather than creating a duplicate.
          await Cr71a_clearanceemailsService.update(existingRecord.cr71a_clearanceemailid, {
            statecode: 0,
            statuscode: 1,
            cr71a_displayname: displayName,
          } as any);
          return existingRecord.cr71a_clearanceemailid;
        }
      } catch (err) {
        // Lookup failed — fall through to create. The create itself will surface a real error.
        console.warn('Recipient lookup failed, falling back to create:', err);
      }

      const payload: any = {
        cr71a_email: email,
        cr71a_displayname: displayName,
        'cr71a_Facility@odata.bind': `/cr71a_facilities(${data.facilityId})`,
      };
      const result = await Cr71a_clearanceemailsService.create(payload);
      return result.data?.cr71a_clearanceemailid;
    },
    []
  );

  // Soft delete — keep the row so it remains in the suggestion pool, but it
  // disappears from the facility's active recipients list (which filters statecode eq 0).
  const removeClearanceEmail = useCallback(async (id: string): Promise<void> => {
    await Cr71a_clearanceemailsService.update(id, { statecode: 1, statuscode: 2 } as any);
  }, []);

  return { getClearanceEmailsForFacility, getAllKnownEmails, addClearanceEmail, removeClearanceEmail };
}
