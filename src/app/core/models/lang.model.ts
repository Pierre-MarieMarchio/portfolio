export type Lang = 'fr' | 'en';

export const LANGS: readonly Lang[] = ['fr', 'en'];

export const DEFAULT_LANG: Lang = 'fr';

export function langOfUrl(url: string): Lang {
  const path = url.split(/[?#]/)[0] ?? '';
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_LANG;
}
