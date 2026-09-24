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
import { OBSERVATORY_TEXTS } from '@app/features/observatory/ports';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { WINDOW_TEXTS } from '@shared/windows/ports';
import { Catalog, PAGES_TEXTS } from '../models/catalog.model';
import { CatalogLoaderService } from '../services/catalog-loader.service';
import { pathOf } from '../rules/paths.rules';

const slice = <K extends keyof Catalog>(key: K) => {
  const catalogs = inject(CatalogLoaderService);
  return computed(() => catalogs.current()[key]);
};

export function provideI18n(): (Provider | EnvironmentProviders)[] {
  return [
    {
      provide: SHARED_TEXTS,
      useFactory: () => slice('shared'),
    },
    {
      provide: WINDOW_TEXTS,
      useFactory: () => slice('windows'),
    },
    {
      provide: PROJECTS_TEXTS,
      useFactory: () => slice('projects'),
    },
    {
      provide: OBSERVATORY_TEXTS,
      useFactory: () => slice('observatory'),
    },
    {
      provide: PROFILE_TEXTS,
      useFactory: () => slice('profile'),
    },
    {
      provide: PAGES_TEXTS,
      useFactory: () => slice('pages'),
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
