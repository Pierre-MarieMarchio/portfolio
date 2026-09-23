import { Project, ProjectFacts, ProofLevel } from './project.model';
import { ProjectSheet } from './project-sheet.model';

/**
 * Everything the projects feature ships, read in one go by the repository:
 * one seam for a future remote source, one loading cycle, and the prerender
 * reads the same one.
 */
export interface ProjectCatalog {
  /** In rank order, which is the distance from the centre in the mockup. */
  readonly projects: readonly Project[];
  readonly facts: Readonly<Record<string, ProjectFacts>>;
  readonly sheets: Readonly<Record<string, ProjectSheet>>;
  /** The proof level said in words. */
  readonly proofLevelLabels: Readonly<Record<ProofLevel, string>>;
  /** The title of an untitled chapter, by position. */
  readonly defaultChapterTitles: readonly string[];
}
