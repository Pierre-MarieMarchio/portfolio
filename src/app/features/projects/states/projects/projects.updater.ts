import { defineUpdater, requestStatus } from 'ngx-statewise';
import { getProjectsActions, projectsReset } from './projects.action';
import { ProjectsState } from './projects.state';

/** The only place the projects' state is written. */
export const projectsUpdater = defineUpdater(ProjectsState, (on) => {
  // `request` clears the previous attempt's error, which is the line a
  // hand-written flow forgets.
  requestStatus(on, getProjectsActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    onSuccess: (state, projects) => {
      state.projects.set(projects);
    },
  });

  on(projectsReset, (state) => {
    state.projects.set([]);
    state.isLoading.set(false);
    state.isError.set(false);
  });
});
