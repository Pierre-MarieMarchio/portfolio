import { FactsSource, ProjectSource } from './project.model';
import { DetailSource } from './project-detail.model';

/**
 * Everything the projects feature ships, read in one go by the repository:
 * one seam for a future remote source, one loading cycle, and the prerender
 * reads the same one. In both languages: the manager reads it in the
 * reader's, so a language switch reloads nothing.
 */
export interface ProjectCatalog {
  /** In rank order, which is the distance from the centre in the mockup. */
  readonly projects: readonly ProjectSource[];
  readonly facts: Readonly<Record<string, FactsSource>>;
  readonly details: Readonly<Record<string, DetailSource>>;
}
