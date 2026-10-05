import { langOfUrl } from '../models/lang.model';
import { bilingual, localize } from './localize.rules';

describe('langOfUrl', () => {
  it.each([
    ['/', 'fr'],
    ['/projets', 'fr'],
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/en/projects?x=1', 'en'],
    ['/english', 'fr'],
    ['/projet/en', 'fr'],
  ] as const)('reads %s as %s', (url, lang) => {
    expect(langOfUrl(url)).toBe(lang);
  });
});

describe('resolve', () => {
  const source = {
    slug: 'a',
    title: 'Same in both',
    tag: bilingual('publié', 'published'),
    chapters: [
      { paragraphs: [bilingual('Un', 'One'), 'Deux · Two'] },
      { figure: { kind: 'flow', steps: ['a', bilingual('b', 'B')] } },
    ],
    count: 3,
    missing: null,
  } as const;

  it('reads every pair in the language, however deep, keeping the rest', () => {
    expect(localize(source, 'en')).toEqual({
      slug: 'a',
      title: 'Same in both',
      tag: 'published',
      chapters: [
        { paragraphs: ['One', 'Deux · Two'] },
        { figure: { kind: 'flow', steps: ['a', 'B'] } },
      ],
      count: 3,
      missing: null,
    });
    expect(localize(source, 'fr').tag).toBe('publié');
  });

  it('leaves a plain record of languages as it is, even beside a pair', () => {
    const languages = { fr: 'Français', en: 'English' };
    const source = { languages, label: bilingual('Un', 'One') };

    expect(localize(source, 'en')).toEqual({ languages, label: 'One' });
    expect(localize(languages, 'en')).toEqual(languages);
  });

  it('keeps a pair of other types whole until it is read', () => {
    expect(localize(bilingual(['a'], ['b']), 'en')).toEqual(['b']);
  });
});
