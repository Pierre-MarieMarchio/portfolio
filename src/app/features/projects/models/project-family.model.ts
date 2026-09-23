export type ProjectFamily = 'professional' | 'personal';

export type FamilyFilter = ProjectFamily | 'all';

export const FAMILIES: readonly FamilyFilter[] = [
  'all',
  'professional',
  'personal',
];
