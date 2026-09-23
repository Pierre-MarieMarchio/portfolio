import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { Observable, of, throwError } from 'rxjs';
import { catalogOf, sampleEntry } from '@testing/fixtures/project.fixture';
import { ProjectCatalog } from '../../models';
import { ProjectsRepositoryService } from '../../services';
import { getProjectsActions } from './projects.action';
import { ProjectsEffect } from './projects.effect';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

const CATALOG = catalogOf([sampleEntry()]);

describe('ProjectsEffect', () => {
  let source: Observable<ProjectCatalog>;
  let reported: unknown[];
  let statewise: Statewise;
  let state: ProjectsState;

  beforeEach(() => {
    reported = [];

    TestBed.configureTestingModule({
      providers: [
        provideStatewiseTesting({ effects: [ProjectsEffect] }),
        {
          provide: ProjectsRepositoryService,
          useValue: { getCatalog: () => source },
        },
        {
          provide: ErrorHandler,
          useValue: { handleError: (error: unknown) => reported.push(error) },
        },
      ],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(projectsUpdater),
    );
    state = TestBed.inject(ProjectsState);
  });

  it('fills the state from what the repository answers', async () => {
    source = of(CATALOG);

    await statewise.dispatchAsync(getProjectsActions.request());

    expect(state.projects()).toEqual(CATALOG.projects);
    expect(state.facts()).toEqual(CATALOG.facts);
    expect(state.details()).toEqual(CATALOG.details);
    expect(state.isLoading()).toBe(false);
    expect(reported).toEqual([]);
  });

  it('reports the cause and flags the failure when the read throws', async () => {
    const cause = new Error('unreachable');
    source = throwError(() => cause);

    await statewise.dispatchAsync(getProjectsActions.request());

    expect(state.isError()).toBe(true);
    expect(state.isLoading()).toBe(false);
    expect(reported).toEqual([cause]);
  });
});
