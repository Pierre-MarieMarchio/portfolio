import '@app/features/projects/data';
import '@app/i18n/data/en.data';
import { draftsLeft } from '@app/core/rules';

describe('English drafts', () => {
  it('counts the English texts still to review, catalogue and projects loaded', () => {
    expect(draftsLeft()).toBe(244);
  });
});
