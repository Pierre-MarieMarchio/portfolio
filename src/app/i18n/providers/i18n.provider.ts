import {
  computed,
  EnvironmentProviders,
  inject,
  provideAppInitializer,
  Provider,
} from '@angular/core';
import { LocaleService } from '@app/core/services';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { ILinks, LINKS } from '@app/features/common';
import { DESKTOP_TEXTS } from '@app/features/desktop/ports';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { PAGES_TEXTS } from '../models/catalog.model';
import { CatalogLoaderService } from '../services/catalog-loader.service';
import { pathOf } from '../rules/paths.rules';

const slice = <T>(read: (catalogs: CatalogLoaderService) => T) => {
  const catalogs = inject(CatalogLoaderService);
  return computed(() => read(catalogs));
};

/**
 * The bilingual site, wired (D3): each layer's slice of the catalogue
 * answered from the reader's language, the links in it, and the catalogue
 * of the first address loaded before the first render.
 */
export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    {
      provide: SHARED_TEXTS,
      useFactory: () => slice((catalogs) => catalogs.current().shared),
    },
    {
      provide: PROJECTS_TEXTS,
      useFactory: () => slice((catalogs) => catalogs.current().projects),
    },
    {
      provide: DESKTOP_TEXTS,
      useFactory: () => slice((catalogs) => catalogs.current().desktop),
    },
    {
      provide: PROFILE_TEXTS,
      useFactory: () => slice((catalogs) => catalogs.current().profile),
    },
    {
      provide: PAGES_TEXTS,
      useFactory: () => slice((catalogs) => catalogs.current().pages),
    },
    {
      provide: LINKS,
      useFactory: (): ILinks => {
        const locale = inject(LocaleService);
        return {
          home: () => pathOf('home', locale.lang()),
          index: () => pathOf('index', locale.lang()),
          about: () => pathOf('about', locale.lang()),
          sheet: (slug) => pathOf('sheet', locale.lang(), slug),
        };
      },
    },
    provideAppInitializer(() =>
      inject(CatalogLoaderService).ensure(inject(LocaleService).lang()),
    ),
  ];
}
