import { Localized } from '@app/core/rules';

export type AddressedView = 'home' | 'index' | 'about' | 'sheet';

export const PATHS: Readonly<Record<AddressedView, Localized>> = {
  home: { fr: '', en: 'en' },
  index: { fr: 'projets', en: 'en/projects' },
  about: { fr: 'a-propos', en: 'en/about' },
  sheet: { fr: 'projet', en: 'en/project' },
};
