import { prefixedPath } from '@app/core/models';
import { bilingual, Localized } from '@app/core/rules';

export type AddressedView = 'home' | 'index' | 'about' | 'sheet';

const SLUGS: Readonly<Record<AddressedView, Localized>> = {
  home: bilingual('', ''),
  index: bilingual('projets', 'projects'),
  about: bilingual('a-propos', 'about'),
  sheet: bilingual('projet', 'project'),
};

const addressOf = (view: AddressedView): Localized =>
  bilingual(
    prefixedPath('fr', SLUGS[view].fr),
    prefixedPath('en', SLUGS[view].en),
  );

export const PATHS: Readonly<Record<AddressedView, Localized>> = {
  home: addressOf('home'),
  index: addressOf('index'),
  about: addressOf('about'),
  sheet: addressOf('sheet'),
};
