import { Localized } from '@app/core/rules';

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
