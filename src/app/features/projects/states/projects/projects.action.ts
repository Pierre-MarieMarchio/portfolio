import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';
import { ProjectCatalog } from '../../models';

export const getProjectsActions = defineActionsGroup({
  source: 'GET_PROJECTS',
  events: {
    request: emptyPayload,
    success: payload<ProjectCatalog>(),
    failure: emptyPayload,
  },
});

/** Back to an empty list, and any read still in flight abandoned. */
export const projectsReset = defineSingleAction('PROJECTS_RESET', emptyPayload);
