import { Lang, langOfUrl, Localized } from '@app/core/i18n';

/** The views that have an address of their own. */
export type AddressedView = 'home' | 'index' | 'about' | 'sheet';

/**
 * The one table of the site's addresses (D4): French at the root, English
 * under `/en`. The routes, the links, the language switch and the head's
 * alternates are all read from it, so an address is renamed here and
 * nowhere else. A sheet's address is this one followed by its slug.
 */
export const PATHS: Readonly<Record<AddressedView, Localized>> = {
  home: { fr: '', en: 'en' },
  index: { fr: 'projets', en: 'en/projects' },
  about: { fr: 'a-propos', en: 'en/about' },
  sheet: { fr: 'projet', en: 'en/project' },
};

/** The absolute path of a view in a language, `/projet/<slug>` for a sheet. */
export function pathOf(view: AddressedView, lang: Lang, slug?: string): string {
  const base = `/${PATHS[view][lang]}`;
  return view === 'sheet' && slug ? `${base}/${slug}` : base;
}

/**
 * The same address in another language: the switch the page bar offers.
 * An address no view claims (an unknown one) moves under or out of `/en`
 * unchanged, so the unknown address stays unknown in the other language.
 */
export function translatePath(url: string, lang: Lang): string {
  const path = (url.split(/[?#]/)[0] ?? '/').replace(/(?<!\/)\/+$/, '');
  const from = langOfUrl(path);
  const segments = path.split('/').filter(Boolean);
  for (const view of ['sheet', 'index', 'about', 'home'] as const) {
    const own = PATHS[view][from].split('/').filter(Boolean);
    const isMatches = own.every(
      (segment, index) => segments[index] === segment,
    );
    const rest = segments.slice(own.length);
    if (isMatches && rest.length === (view === 'sheet' ? 1 : 0)) {
      return pathOf(view, lang, rest[0]);
    }
  }
  const bare = from === 'en' ? segments.slice(1) : segments;
  return `/${[...(lang === 'en' ? ['en'] : []), ...bare].join('/')}`;
}
