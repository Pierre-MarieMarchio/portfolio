import { EN } from '@app/i18n/data/en.data';
import { FR } from '@app/i18n/data/fr.data';

describe('home status line', () => {
  it('says the work-study search in both languages', () => {
    expect(FR.desktop.home.status).toBe(
      'Je cherche le prochain projet à construire.',
    );
    expect(EN.desktop.home.status).toBe(
      'I am looking for the next project to build.',
    );
  });
});
