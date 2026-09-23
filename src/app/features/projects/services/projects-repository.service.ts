import { Service } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PROJECTS } from '../data';
import { ProjectCatalog, ProjectEntry } from '../models';

/** One part of every entry, keyed by the entry's slug. */
function bySlug<T>(part: (entry: ProjectEntry) => T): Record<string, T> {
  return Object.fromEntries(
    PROJECTS.map((entry) => [entry.project.slug, part(entry)]),
  );
}

/**
 * Where the projects come from. Today the content ships with the site, so the
 * answer is synchronous; it is an Observable all the same, because that is
 * the seam a remote source would plug into, and the effect already reads it
 * that way.
 *
 * One read answers the whole catalog: projects, facts and details share one
 * loading cycle, so a detail is never there while its project is not.
 */
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
