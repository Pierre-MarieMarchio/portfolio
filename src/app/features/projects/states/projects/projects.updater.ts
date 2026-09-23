import { defineUpdater, requestStatus } from 'ngx-statewise';
import { getProjectsActions } from './projects.action';
import { ProjectsState } from './projects.state';

export const projectsUpdater = defineUpdater(ProjectsState, (on) => {
  requestStatus(on, getProjectsActions, {
    loading: (state) => state.isLoading,
    error: (state) => state.isError,
    onSuccess: (state, catalog) => {
      state.projects.set(catalog.projects);
      state.facts.set(catalog.facts);
      state.details.set(catalog.details);
    },
  });
});
