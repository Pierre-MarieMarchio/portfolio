import { ErrorHandler, inject, Service } from '@angular/core';
import { createEffect } from 'ngx-statewise';
import { catchError, map, of } from 'rxjs';
import { ProjectsRepositoryService } from '../../services';
import { getProjectsActions } from './projects.action';

@Service()
export class ProjectsEffect {
  private readonly repository = inject(ProjectsRepositoryService);
  private readonly errorHandler = inject(ErrorHandler);

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
