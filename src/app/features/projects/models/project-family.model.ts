export const PROJECT_FAMILIES = ['professional', 'personal'] as const;

export type ProjectFamily = (typeof PROJECT_FAMILIES)[number];

export type FamilyFilter = ProjectFamily | 'all';

export const FAMILIES: readonly FamilyFilter[] = ['all', ...PROJECT_FAMILIES];
