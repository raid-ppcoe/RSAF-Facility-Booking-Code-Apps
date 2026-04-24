export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.0.82',
    date: '2026-04-23',
    changes: [
      'Added Clearances schema and clearance management support',
      'Enhanced Booking Form with clearance integration',
      'Improved Facilities Management features for Super Admin',
      'Added Changelog Modal for version history display',
      'Updated Infrastructure and Layout components',
      'Refined Facility Approvers logic',
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
