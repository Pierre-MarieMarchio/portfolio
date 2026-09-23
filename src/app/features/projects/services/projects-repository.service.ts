import { Service } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PROJECTS } from '../data';
import { ProjectCatalog, ProjectEntry } from '../models';

function bySlug<T>(part: (entry: ProjectEntry) => T): Record<string, T> {
  return Object.fromEntries(
    PROJECTS.map((entry) => [entry.project.slug, part(entry)]),
  );
}

@Service()
export class ProjectsRepositoryService {
  public getCatalog(): Observable<ProjectCatalog> {
    return of({
      projects: PROJECTS.map((entry) => entry.project),
      facts: bySlug((entry) => entry.facts),
      details: bySlug((entry) => entry.detail),
    });
  }
}
