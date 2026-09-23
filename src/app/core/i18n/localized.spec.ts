import { langOfUrl } from './lang';
import { resolve } from './localized';

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
    tag: { fr: 'publié', en: 'published' },
    chapters: [
      { paragraphs: [{ fr: 'Un', en: 'One' }, 'Deux · Two'] },
      { figure: { kind: 'flow', steps: ['a', { fr: 'b', en: 'B' }] } },
    ],
    count: 3,
    missing: null,
  } as const;

  it('reads every pair in the language, however deep, keeping the rest', () => {
    expect(resolve(source, 'en')).toEqual({
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
    expect(resolve(source, 'fr').tag).toBe('publié');
  });

  /** A pair is exactly `fr` and `en`: an object with more is content. */
  it('leaves an object with other keys beside fr and en as it is', () => {
    const labels = { fr: 'Français', en: 'English', de: 'Deutsch' };

    expect(resolve(labels, 'en')).toEqual(labels);
  });
});
