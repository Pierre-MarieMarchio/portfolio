import { Injectable, signal } from '@angular/core';
import { Project, ProjectFacts, ProjectSheet, ProofLevel } from '../../models';

/** Before a load and after a reset: no level has a label yet. */
export const NO_PROOF_LEVEL_LABELS: Readonly<Record<ProofLevel, string>> = {
  public: '',
  indirect: '',
  none: '',
};

/**
 * Only what cannot be derived: the catalog as the repository answered it.
 * The featured projects, a project, its facts or its sheet by slug, the
 * counts per family are all computed by the manager from these.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsState {
  public readonly projects = signal<readonly Project[]>([]);
  public readonly facts = signal<Readonly<Record<string, ProjectFacts>>>({});
  public readonly sheets = signal<Readonly<Record<string, ProjectSheet>>>({});
  public readonly proofLevelLabels = signal<
    Readonly<Record<ProofLevel, string>>
  >(NO_PROOF_LEVEL_LABELS);
  public readonly defaultChapterTitles = signal<readonly string[]>([]);
  public readonly isLoading = signal(false);
  public readonly isError = signal(false);
}
