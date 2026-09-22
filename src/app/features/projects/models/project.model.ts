/**
 * Where a project was made. It is the context a reader asks about, not a
 * category invented for filtering.
 */
export type ProjectFamily = 'professional' | 'personal';

/**
 * One project, as much as the base needs. The mockup's facts (proof, access
 * level, role, stack) and its chapters arrive with it, as fields added here.
 */
export interface Project {
  /** The address segment, and the identity: two projects never share one. */
  readonly slug: string;
  readonly title: string;
  readonly family: ProjectFamily;
  /** Shown on the home page. The order of the list is the order of rank. */
  readonly featured: boolean;
}
