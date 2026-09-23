import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { catalogOf, sampleEntry } from '@testing/fixtures/project.fixture';
import { getProjectsActions } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

const CATALOG = catalogOf([sampleEntry()]);

describe('projectsUpdater', () => {
  let statewise: Statewise;
  let state: ProjectsState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStatewiseTesting()],
    });

    statewise = TestBed.runInInjectionContext(() =>
      injectStatewise(projectsUpdater),
    );
    state = TestBed.inject(ProjectsState);
  });

  it('starts loading and clears a previous error on a request', () => {
    statewise.dispatch(getProjectsActions.failure());
    expect(state.isError()).toBe(true);

    statewise.dispatch(getProjectsActions.request());

    expect(state.isLoading()).toBe(true);
    expect(state.isError()).toBe(false);
  });

  it('fills the whole catalog and stops loading on success', () => {
    statewise.dispatch(getProjectsActions.request());
    statewise.dispatch(getProjectsActions.success(CATALOG));

    expect(state.projects()).toEqual(CATALOG.projects);
    expect(state.facts()).toEqual(CATALOG.facts);
    expect(state.details()).toEqual(CATALOG.details);
    expect(state.isLoading()).toBe(false);
  });

  it('marks the error and stops loading on failure', () => {
    statewise.dispatch(getProjectsActions.request());
    statewise.dispatch(getProjectsActions.failure());

    expect(state.isError()).toBe(true);
    expect(state.isLoading()).toBe(false);
  });
});
