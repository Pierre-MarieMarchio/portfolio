import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DEFAULT_CHAPTER_TITLES, PROJECTS, PROOF_LEVEL_LABELS } from '../data';
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
 * One read answers the whole catalog: projects, facts and sheets share one
 * loading cycle, so a sheet is never there while its project is not.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsRepository {
  public getCatalog(): Observable<ProjectCatalog> {
    return of({
      projects: PROJECTS.map((entry) => entry.project),
      facts: bySlug((entry) => entry.facts),
      sheets: bySlug((entry) => entry.sheet),
      proofLevelLabels: PROOF_LEVEL_LABELS,
      defaultChapterTitles: DEFAULT_CHAPTER_TITLES,
    });
  }
}
