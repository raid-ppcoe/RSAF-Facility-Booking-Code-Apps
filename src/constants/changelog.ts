export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.0.75',
    date: '2026-04-14',
    changes: [
      'Improved Facilities Management features for Super Admin',
      'New Global Admin role with elevated permissions',
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
