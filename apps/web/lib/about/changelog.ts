export type ChangelogEntry = {
  version: string;
  date: string;
  changes: string[];
};

/** Newest first. Update this file when shipping a release. English only. */
export const changelog: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-09-21',
    changes: [
      'Initial public release of Compy.',
      'Create and share free-form comparisons with criteria, entries, rules, and results.',
    ],
  },
];
