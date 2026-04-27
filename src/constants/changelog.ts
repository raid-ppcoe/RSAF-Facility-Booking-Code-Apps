export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-04-27',
    changes: [
      'Implemented complete clearance workflow with email notifications',
      'Added ClearanceEmailTemplate component for approval workflows',
      'Enhanced AvailabilityCalendar with improved date filtering and rendering',
      'Refactored BookingForm for better clearance integration',
      'New useClearanceEmails hook for email management',
      'Added infographic visualization for facility booking process',
      'Updated AGENT-GUIDE and SKILLS documentation',
      'Synchronized Dataverse schemas for bookings, clearances, and facilities',
    ],
  },
  {
    version: '1.0.74',
    date: '2026-04-14',
    changes: [
      'UI/UX experience improvements',
      'Minor bug fixes',
      'Added update logs feature',
    ],
  },
  {
    version: '1.0.72',
    date: '2026-04-10',
    changes: [
      'Initial stable release',
    ],
  },
];
