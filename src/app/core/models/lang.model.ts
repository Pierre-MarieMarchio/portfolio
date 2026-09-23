/** The languages of the site. French is the default, at the root. */
export type Lang = 'fr' | 'en';

export const LANGS: readonly Lang[] = ['fr', 'en'];

export const DEFAULT_LANG: Lang = 'fr';

/**
 * The language an address is in (D4): `/en` and everything under it is
 * English, every other address French. The address is the one source of the
 * language, so each page is prerendered, indexed and shared in its own.
 */
export function langOfUrl(url: string): Lang {
  const path = url.split(/[?#]/)[0] ?? '';
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_LANG;
}
