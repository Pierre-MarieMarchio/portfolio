import { EN } from '@app/i18n/data/en.data';
import { FR } from '@app/i18n/data/fr.data';

describe('home status line', () => {
  it('says the work-study search in both languages', () => {
    expect(FR.desktop.home.status).toBe(
      'Je cherche une alternance à Toulouse ou en télétravail, disponible dès maintenant.',
    );
    expect(EN.desktop.home.status).toBe(
      'I am looking for a work-study position in Toulouse or remote, available now.',
    );
  });
});
