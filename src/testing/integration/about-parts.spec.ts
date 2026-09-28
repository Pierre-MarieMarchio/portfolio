import { Catalog } from '@app/i18n';
import { EN } from '@app/i18n/data/en.data';
import { FR } from '@app/i18n/data/fr.data';

const partLabels = ({ profile: { about } }: Catalog) => [
  about.profile.label,
  about.skills.label,
  about.path.label,
  about.method.label,
];

describe('the parts of "about"', () => {
  it.each([
    ['French', FR],
    ['English', EN],
  ])(
    'reads Profile, Skills, Path, then What next in %s, window and sky alike',
    (_language, catalog) => {
      expect(catalog.observatory.object.parts).toEqual(partLabels(catalog));
    },
  );
});
