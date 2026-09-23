import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { Lang } from '@app/core/models';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { DESKTOP_TEXTS } from '@app/features/desktop/ports';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { Catalog, PAGES_TEXTS, pathOf } from '@app/i18n';
import { EN } from '@app/i18n/data/en.data';
import { FR } from '@app/i18n/data/fr.data';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { WINDOW_TEXTS } from '@shared/windows/ports';

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
    { provide: WINDOW_TEXTS, useValue: signal(catalog.windows) },
    { provide: PROJECTS_TEXTS, useValue: signal(catalog.projects) },
    { provide: DESKTOP_TEXTS, useValue: signal(catalog.desktop) },
    { provide: PROFILE_TEXTS, useValue: signal(catalog.profile) },
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
