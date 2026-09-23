import { defineUpdater, requestStatus } from 'ngx-statewise';
import { getProjectsActions } from './projects.action';
import { ProjectsState } from './projects.state';

/** The only place the projects' state is written. */
export const projectsUpdater = defineUpdater(ProjectsState, (on) => {
  // `request` clears the previous attempt's error, which is the line a
  // hand-written flow forgets.
  requestStatus(on, getProjectsActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    // The whole catalog at once: projects, facts and details never disagree
    // about which load they come from.
    onSuccess: (state, catalog) => {
      state.projects.set(catalog.projects);
      state.facts.set(catalog.facts);
      state.details.set(catalog.details);
    },
  });
});
