import { Injectable, signal } from '@angular/core';
import { FactsSource, ProjectSource, SheetSource } from '../../models';

/**
 * Only what cannot be derived: the catalog as the repository answered it,
 * in both languages. The projects in the reader's language, the featured
 * ones, a project, its facts or its sheet by slug, the counts per family are
 * all computed by the manager from these.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsState {
  public readonly projects = signal<readonly ProjectSource[]>([]);
  public readonly facts = signal<Readonly<Record<string, FactsSource>>>({});
  public readonly sheets = signal<Readonly<Record<string, SheetSource>>>({});
  public readonly isLoading = signal(false);
  public readonly isError = signal(false);
}
