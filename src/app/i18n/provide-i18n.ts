import {
  computed,
  EnvironmentProviders,
  inject,
  provideAppInitializer,
  Provider,
} from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { langOfUrl } from '@app/core/models';
import { LocaleService } from '@app/core/services';
import { PROJECTS_TEXTS } from '@app/features/projects/i18n';
import { ILinks, LINKS } from '@app/features/common';
import { DESKTOP_TEXTS } from '@app/features/desktop/ports';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { PAGES_TEXTS } from './catalog';
import { Catalogs } from './catalogs.service';
import { pathOf } from './paths';

/**
 * Loads the catalogue of the address about to open, and takes its language
 * before the route activates: the markers declare their view in their
 * constructor, and the first render after them already speaks the new
 * language.
 */
export const loadCatalog: CanActivateFn = async (_route, state) => {
  // Both taken before the wait: past an `await`, `inject` has no context.
  const catalogs = inject(Catalogs);
  const locale = inject(LocaleService);
  const lang = langOfUrl(state.url);
  await catalogs.ensure(lang);
  locale.set(lang);
  return true;
};

const slice = <T>(read: (catalogs: Catalogs) => T) => {
  const catalogs = inject(Catalogs);
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
      useFactory: () => slice((catalogs) => catalogs.current().station),
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
      inject(Catalogs).ensure(inject(LocaleService).lang()),
    ),
  ];
}
