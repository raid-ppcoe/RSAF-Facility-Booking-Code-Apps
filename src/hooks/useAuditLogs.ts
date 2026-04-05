import { useState, useEffect, useCallback } from 'react';
import { Cr71a_auditlogsService } from '../generated/services/Cr71a_auditlogsService';

export type AuditAction = 'created' | 'approved' | 'rejected' | 'deleted' | 'cancelled';

const ACTION_TO_DATAVERSE: Record<AuditAction, number> = {
  created: 406210000,    // "Created"
  approved: 406210001,   // "Modified" (status change → approved)
  rejected: 406210002,   // "Deleted" (status change → rejected)
  deleted: 406210003,    // "Cancelled" (booking removed)
  cancelled: 406210002,  // Maps to same as rejected in Dataverse
};

const DATAVERSE_TO_ACTION: Record<number, AuditAction> = {
  406210000: 'created',
  406210001: 'approved',
  406210002: 'rejected',
  406210003: 'deleted',
};

export const ACTION_LABELS: Record<AuditAction, string> = {
  created: 'Created',
  approved: 'Approved',
  rejected: 'Rejected',
  deleted: 'Deleted',
  cancelled: 'Cancelled',
};

export interface AuditLog {
  id: string;
  action: AuditAction;
  actionLabel: string;
  entityType: string;
  recordId: string;
  performedById: string;
  performedByName: string;
  bookerId: string;
  bookerName: string;
  timestamp: string;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await Cr71a_auditlogsService.getAll({
        select: [
          'cr71a_auditlogid',
          'cr71a_action',
          'cr71a_entityname',
          'cr71a_recordid',
          'cr71a_actiondatetime',
          'createdon',
        ],
        filter: 'statecode eq 0',
        orderBy: ['cr71a_actiondatetime desc'],
        top: 200,
      });
      if (!result.success) {
        setError(result.error?.message || 'Failed to retrieve audit logs');
        return;
      }
      if (result.data) {
        setLogs(
          result.data.map((log: any) => {
            const action = DATAVERSE_TO_ACTION[log.cr71a_action as number] || 'created';
            return {
              id: log.cr71a_auditlogid,
              action,
              actionLabel: ACTION_LABELS[action],
              entityType: log.cr71a_entityname || 'booking',
              recordId: log.cr71a_recordid || '',
              performedById: log._cr71a_user_value || '',
              performedByName: log['_cr71a_user_value@OData.Community.Display.V1.FormattedValue'] || '',
              bookerId: log._cr71a_bookedby_value || '',
              bookerName: log['_cr71a_bookedby_value@OData.Community.Display.V1.FormattedValue'] || '',
              timestamp: log.cr71a_actiondatetime || log.createdon || '',
            };
          })
        );
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(`Failed to load audit logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const createLog = useCallback(async (params: {
    action: AuditAction;
    entityType: string;
    recordId: string;
    userId: string;
    userName: string;
    bookerId?: string;
  }) => {
    try {
      const bookerId = params.bookerId || params.userId;
      const payload: any = {
        cr71a_action: ACTION_TO_DATAVERSE[params.action],
        cr71a_entityname: params.entityType,
        cr71a_recordid: params.recordId,
        cr71a_actiondatetime: new Date().toISOString(),
        "cr71a_User@odata.bind": `/cr71a_profiles(${params.userId})`,
        "cr71a_BookedBy@odata.bind": `/cr71a_profiles(${bookerId})`,
      };
      await Cr71a_auditlogsService.create(payload);
    } catch (err: any) {
      // Audit log creation failure should not block the main operation
      console.error('Failed to create audit log:', err);
    }
  }, []);

  return { logs, loading, error, createLog, reload: loadLogs };
}
