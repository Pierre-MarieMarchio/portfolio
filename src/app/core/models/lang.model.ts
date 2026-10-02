export type Lang = 'fr' | 'en';

export const LANGS: readonly Lang[] = ['fr', 'en'];

export const DEFAULT_LANG: Lang = 'fr';

const LANG_PREFIXES: Readonly<Record<Lang, string>> = {
  fr: '',
  en: 'en',
};

export function langOfUrl(url: string): Lang {
  const path = url.split(/[?#]/)[0] ?? '';
  const first = path.split('/')[1];
  return LANGS.find((lang) => LANG_PREFIXES[lang] === first) ?? DEFAULT_LANG;
}

export function prefixedPath(lang: Lang, path: string): string {
  return [LANG_PREFIXES[lang], path].filter(Boolean).join('/');
}

export function unprefixedSegments(url: string): string[] {
  const segments = (url.split(/[?#]/)[0] ?? '').split('/').filter(Boolean);
  return LANG_PREFIXES[langOfUrl(url)] === '' ? segments : segments.slice(1);
}
