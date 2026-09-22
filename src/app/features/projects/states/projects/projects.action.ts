import {
  defineActionsGroup,
  defineSingleAction,
  emptyPayload,
  payload,
} from 'ngx-statewise';
import { Project } from '../../models';

export const getProjectsActions = defineActionsGroup({
  source: 'GET_PROJECTS',
  events: {
    request: emptyPayload,
    success: payload<readonly Project[]>(),
    failure: emptyPayload,
  },
});

/** Back to an empty list, and any read still in flight abandoned. */
export const projectsReset = defineSingleAction('PROJECTS_RESET', emptyPayload);
