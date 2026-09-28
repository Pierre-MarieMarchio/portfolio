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
  it('reads Profile, Skills, Path, then What next, in French', () => {
    expect(partLabels(FR)).toEqual([
      'Profil',
      'Compétences',
      'Parcours',
      'Et après',
    ]);
    expect(FR.observatory.object.parts).toEqual(partLabels(FR));
  });

  it('reads the same order in English, window and sky alike', () => {
    expect(partLabels(EN)).toEqual(['Profile', 'Skills', 'Path', 'What next']);
    expect(EN.observatory.object.parts).toEqual(partLabels(EN));
  });
});
