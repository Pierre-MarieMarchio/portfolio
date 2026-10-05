import '@app/features/projects/data';
import '@app/i18n/data/en.data';
import { draftsLeft } from '@app/core/rules';
import { PROJECTS } from '@app/features/projects/data';
import projectsJson from '@app/features/projects/data/projects.data.json';

const INTERFACE_DRAFTS = 160;

describe('English drafts', () => {
  it('counts interface catalogues and project drafts separately from JSON, totalling all pending reviews', () => {
    const inProjects =
      JSON.stringify(projectsJson).split('"enDraft"').length - 1;

    expect(PROJECTS).toHaveLength(projectsJson.length);
    expect(draftsLeft()).toBe(INTERFACE_DRAFTS + inProjects);
  });
});
