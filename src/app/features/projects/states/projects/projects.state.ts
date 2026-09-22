import { Injectable, signal } from '@angular/core';
import { Project } from '../../models';

/**
 * Only what cannot be derived. The featured projects, a project by its slug
 * or the count are all computed by the manager from this list.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsState {
  public readonly projects = signal<readonly Project[]>([]);
  public readonly isLoading = signal(false);
  public readonly isError = signal(false);
}
