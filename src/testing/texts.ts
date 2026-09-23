import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { Lang } from '@app/core/i18n';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '@app/features/projects/i18n';
import { STATION_TEXTS } from '@app/features/station/i18n';
import { Catalog, PAGES_TEXTS, pathOf } from '@app/i18n';
import { EN } from '@app/i18n/en';
import { FR } from '@app/i18n/fr';
import { SHARED_TEXTS } from '@shared/ui/texts';

const CATALOGS: Readonly<Record<Lang, Catalog>> = { fr: FR, en: EN };

/**
 * Each layer's texts and the links, in one language, answered at once: a
 * component spec needs the words, not the loading of a chunk. The real
 * wiring (`provideI18n`) is exercised by `src/integration/i18n.spec.ts`.
 */
export const provideTexts = (
  lang: Lang = 'fr',
): (Provider | EnvironmentProviders)[] => {
  const catalog = CATALOGS[lang];
  return [
    { provide: SHARED_TEXTS, useValue: signal(catalog.shared) },
    { provide: PROJECTS_TEXTS, useValue: signal(catalog.projects) },
    { provide: STATION_TEXTS, useValue: signal(catalog.station) },
    { provide: PAGES_TEXTS, useValue: signal(catalog.pages) },
    {
      provide: LINKS,
      useValue: {
        home: () => pathOf('home', lang),
        index: () => pathOf('index', lang),
        about: () => pathOf('about', lang),
        sheet: (slug: string) => pathOf('sheet', lang, slug),
      },
    },
  ];
};
