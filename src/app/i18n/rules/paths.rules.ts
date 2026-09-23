import { Lang, langOfUrl } from '@app/core/models';
import { AddressedView, PATHS } from '../data/paths.data';

export function pathOf(view: AddressedView, lang: Lang, slug?: string): string {
  const base = `/${PATHS[view][lang]}`;
  return view === 'sheet' && slug ? `${base}/${slug}` : base;
}

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
