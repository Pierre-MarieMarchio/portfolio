import { TestBed } from '@angular/core/testing';
import { injectStatewise, type Statewise } from 'ngx-statewise';
import { provideStatewiseTesting } from 'ngx-statewise/testing';
import { sampleProject } from '@testing/fake-managers';
import { getProjectsActions, projectsReset } from './projects.action';
import { ProjectsState } from './projects.state';
import { projectsUpdater } from './projects.updater';

const PROJECTS = [sampleProject()];

/**
 * No effects are registered, so a dispatch runs the updater and nothing else.
 * What is under test is the state machine, not the repository behind it.
 */
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

  it('fills the projects and stops loading on success', () => {
    statewise.dispatch(getProjectsActions.request());
    statewise.dispatch(getProjectsActions.success(PROJECTS));

    expect(state.projects()).toEqual(PROJECTS);
    expect(state.isLoading()).toBe(false);
  });

  it('marks the error and stops loading on failure', () => {
    statewise.dispatch(getProjectsActions.request());
    statewise.dispatch(getProjectsActions.failure());

    expect(state.isError()).toBe(true);
    expect(state.isLoading()).toBe(false);
  });

  it('empties everything on reset', () => {
    statewise.dispatch(getProjectsActions.success(PROJECTS));
    statewise.dispatch(getProjectsActions.failure());

    statewise.dispatch(projectsReset());

    expect(state.projects()).toEqual([]);
    expect(state.isError()).toBe(false);
  });
});
