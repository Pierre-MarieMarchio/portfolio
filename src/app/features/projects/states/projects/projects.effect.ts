import { ErrorHandler, inject, Service } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { catchError, map, of } from 'rxjs';
import { ProjectsRepositoryService } from '../../services';
import { getProjectsActions } from './projects.action';

@Service()
export class ProjectsEffect {
  private readonly repository = inject(ProjectsRepositoryService);
  private readonly errorHandler = inject(ErrorHandler);

  /**
   * Handed over as an Observable: the engine subscribes to it itself, so
   * abandoning a run unsubscribes the read rather than ignoring its answer.
   *
   * The cause goes to the `ErrorHandler`, and the state only learns that the
   * read failed: the reason is for whoever debugs, the flag is for the page.
   */
  public readonly getProjectsRequestEffect = createEffect(
    getProjectsActions.request,
    () =>
      this.repository.getCatalog().pipe(
        map((catalog) => getProjectsActions.success(catalog)),
        catchError((error: unknown) => {
          this.errorHandler.handleError(error);

          return of(getProjectsActions.failure());
        }),
      ),
    { concurrency: 'latest', mustAnswer: true },
  );
}
