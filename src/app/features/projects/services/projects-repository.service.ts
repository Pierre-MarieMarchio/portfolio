import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  DEFAULT_CHAPTER_TITLES,
  FACTS,
  LAYERS,
  PROJECTS,
  PROOF_LEVEL_LABELS,
  SHEETS,
} from '../data';
import { ProjectCatalog } from '../models';

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
      projects: PROJECTS,
      facts: FACTS,
      sheets: SHEETS,
      proofLevelLabels: PROOF_LEVEL_LABELS,
      defaultChapterTitles: DEFAULT_CHAPTER_TITLES,
      layers: LAYERS,
    });
  }
}
