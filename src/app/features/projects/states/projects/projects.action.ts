import { defineActionsGroup, emptyPayload, payload } from 'ngx-statewise';
import { ProjectCatalog } from '../../models';

export const getProjectsActions = defineActionsGroup({
  source: 'GET_PROJECTS',
  events: {
    request: emptyPayload,
    success: payload<ProjectCatalog>(),
    failure: emptyPayload,
  },
});
