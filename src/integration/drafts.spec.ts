import { draftsLeft } from '@app/core/rules';
import { PROJECTS } from '@app/features/projects/data';
import { EN } from '@app/i18n/data/en.data';

describe('English drafts', () => {
  it('has the whole English text loaded, catalogue and projects', () => {
    expect(EN.pages.heads.home.title).toBeTruthy();
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it('counts the English texts still to review', () => {
    expect(draftsLeft()).toBe(241);
  });
});
