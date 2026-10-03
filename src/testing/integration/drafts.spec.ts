import '@app/features/projects/data';
import '@app/i18n/data/en.data';
import { draftsLeft } from '@app/core/rules';
import { PROJECTS } from '@app/features/projects/data';
import projectsJson from '@app/features/projects/data/projects.data.json';

const INTERFACE_DRAFTS = 156;

describe('English drafts', () => {
  it('counts the English texts still to review, catalogue and projects loaded', () => {
    expect(draftsLeft()).toBe(255);
  });

  it('counts one draft per enDraft key of the projects file, and 156 in the interface catalogues', () => {
    const inProjects =
      JSON.stringify(projectsJson).split('"enDraft"').length - 1;

    expect(PROJECTS).toHaveLength(projectsJson.length);
    expect(draftsLeft() - inProjects).toBe(INTERFACE_DRAFTS);
  });
});
