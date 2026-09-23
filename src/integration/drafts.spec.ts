import { draftsLeft } from '@app/core/rules';
import { PROJECTS } from '@app/features/projects/data';
import { EN } from '@app/i18n/data/en.data';

/**
 * The English texts not yet read by the author. Every one was written as
 * `draft('…')`, in `src/app/i18n/en.ts` and in the project files; reviewing
 * one is removing its `draft(` call, and this count then goes down by one.
 * The number below is the one left, updated at each review: a count that
 * moves without anyone updating it is a text marked or reviewed by mistake.
 */
describe('English drafts', () => {
  it('has the whole English text loaded, catalogue and projects', () => {
    expect(EN.pages.heads.home.title).toBeTruthy();
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  it('counts the English texts still to review', () => {
    expect(draftsLeft()).toBe(239);
  });
});
