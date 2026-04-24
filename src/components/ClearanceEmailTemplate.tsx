import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy, Check, Mail } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useClearanceEmails } from '../hooks/useClearanceEmails';
import type { Facility, ClearanceEmailField } from '../types';

interface Props {
  booking: { date: string; startTime: string; endTime: string; purpose: string; id: string };
  facility: Facility;
  fields: ClearanceEmailField[];
  fieldsData: Record<string, string>;
  onClose: () => void;
}

const DEFAULT_FIELDS: ClearanceEmailField[] = [
  { id: 'default-name',     label: 'Full Name', inputType: 'auto', autoSource: 'name' },
  { id: 'default-facility', label: 'Facility',  inputType: 'auto', autoSource: 'facility' },
  { id: 'default-date',     label: 'Date',      inputType: 'auto', autoSource: 'date' },
  { id: 'default-time',     label: 'Time',      inputType: 'auto', autoSource: 'time' },
  { id: 'default-purpose',  label: 'Purpose',   inputType: 'auto', autoSource: 'purpose' },
];

export const ClearanceEmailTemplate: React.FC<Props> = ({ booking, facility, fields, fieldsData, onClose }) => {
  const { facilityApprovers } = useAppContext();
  const { getClearanceEmailsForFacility } = useClearanceEmails();
  const [fpRecipients, setFpRecipients] = useState<{ email: string; displayName: string }[]>([]);
  const [copied, setCopied] = useState(false);

  // If no fields configured for this facility, fall back to a default template set
  // so the popup still provides a useful template.
  const displayFields = useMemo(() => (fields.length > 0 ? fields : DEFAULT_FIELDS), [fields]);

  const resolvedData = useMemo(() => {
    // Ensure defaults resolve from booking/facility context when fieldsData is empty.
    if (fields.length > 0) return fieldsData;
    return {
      'Full Name': '',
      'Facility': facility.name,
      'Date': booking.date,
      'Time': `${booking.startTime} – ${booking.endTime}`,
      'Purpose': booking.purpose,
    } as Record<string, string>;
  }, [fields.length, fieldsData, facility.name, booking.date, booking.startTime, booking.endTime, booking.purpose]);

  useEffect(() => {
    getClearanceEmailsForFacility(facility.id).then(setFpRecipients);
  }, [facility.id, getClearanceEmailsForFacility]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const approvers = facilityApprovers.filter(a => a.facilityId === facility.id);
  const ccList = approvers.map(a => a.displayName || 'Facility Approver').filter(Boolean);

  const toLine = fpRecipients.length > 0
    ? fpRecipients.map(r => r.displayName !== r.email ? `${r.displayName} <${r.email}>` : r.email).join(', ')
    : 'Force Protection (FP) on OSN';

  const subject = `Clearance Request — ${facility.name} — ${booking.date}`;

  const buildPlainText = () => {
    const lines: string[] = [
      `To: ${toLine}`,
      ccList.length > 0 ? `CC: ${ccList.join(', ')}` : '',
      `Subject: ${subject}`,
      '',
      'Dear FP,',
      '',
      'I would like to request clearance for the following booking. Please find my details below:',
      '',
      ...displayFields.map((field) => {
        if (field.inputType === 'user_input') {
          return `${field.label}: _____________________`;
        }
        const value = resolvedData[field.label];
        return `${field.label}: ${value || '—'}`;
      }),
      '',
      'Thank you.',
    ].filter(line => line !== null);
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildPlainText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Mail size={18} />
            <div>
              <h3 className="font-bold text-base">Send Clearance Email on OSN</h3>
              <p className="text-xs text-blue-200 mt-0.5">Use this template to email Force Protection for clearance.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Email metadata */}
        <div className="border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start gap-3 px-6 py-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[48px] pt-0.5">To</span>
            <span className="text-sm font-semibold text-blue-700">{toLine}</span>
          </div>
          {ccList.length > 0 && (
            <div className="flex items-start gap-3 px-6 py-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[48px] pt-0.5">CC</span>
              <span className="text-sm font-semibold text-blue-700">{ccList.join(', ')}</span>
            </div>
          )}
          <div className="flex items-start gap-3 px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[48px] pt-0.5">Subject</span>
            <span className="text-sm text-slate-700 font-medium">{subject}</span>
          </div>
        </div>

        {/* Email body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Message Body</p>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Dear FP,<br /><br />
            I would like to request clearance for the following booking. Please find my details below:
          </p>
          <table className="w-full border-collapse rounded-xl overflow-hidden border border-slate-200 text-sm">
            <tbody>
              {displayFields.map((field) => {
                const isBlank = field.inputType === 'user_input';
                const value = resolvedData[field.label] ?? '';
                return (
                  <tr key={field.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-500 bg-slate-50 w-36 whitespace-nowrap align-top">
                      {field.label}
                      {isBlank && field.required !== false && <span className="text-rose-500"> *</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {isBlank ? (
                        <span className="italic text-slate-400 border-b-2 border-dashed border-slate-300 pb-0.5 px-1">
                          fill in on OSN
                        </span>
                      ) : (
                        value || <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 flex-shrink-0">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Send this email on OSN. Your booking slot is reserved.
          </p>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Email</>}
          </button>
        </div>
      </div>
    </div>
  );
};
