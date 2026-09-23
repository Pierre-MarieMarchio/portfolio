import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { langOfUrl } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { CatalogLoaderService } from '../services/catalog-loader.service';

/**
 * Loads the catalogue of the address about to open, and takes its language
 * before the route activates: the markers declare their view in their
 * constructor, and the first render after them already speaks the new
 * language.
 */
export const loadCatalog: CanActivateFn = async (_route, state) => {
  // Both taken before the wait: past an `await`, `inject` has no context.
  const catalogs = inject(CatalogLoaderService);
  const locale = inject(LocaleService);
  const lang = langOfUrl(state.url);
  await catalogs.ensure(lang);
  locale.set(lang);
  return true;
};
