import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PROJECTS } from '../data';
import { Project } from '../models';

/**
 * Where the projects come from. Today the content ships with the site, so the
 * answer is synchronous; it is an Observable all the same, because that is
 * the seam a remote source would plug into, and the effect already reads it
 * that way.
 */
@Injectable({ providedIn: 'root' })
export class ProjectsRepositoryService {
  public getAll(): Observable<readonly Project[]> {
    return of(PROJECTS);
  }
}
