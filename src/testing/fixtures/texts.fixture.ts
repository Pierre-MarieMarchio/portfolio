import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { LINKS } from '@app/features/common';
import { PROJECTS_TEXTS } from '@app/features/projects/ports';
import { DESKTOP_TEXTS } from '@app/features/desktop/ports';
import { PROFILE_TEXTS } from '@app/features/profile/ports';
import { PAGES_TEXTS, pathOf } from '@app/i18n';
import { FR } from '@app/i18n/data/fr.data';
import { SHARED_TEXTS } from '@shared/ui/ports';
import { WINDOW_TEXTS } from '@shared/windows/ports';

export const provideTexts = (): (Provider | EnvironmentProviders)[] => [
  { provide: SHARED_TEXTS, useValue: signal(FR.shared) },
  { provide: WINDOW_TEXTS, useValue: signal(FR.windows) },
  { provide: PROJECTS_TEXTS, useValue: signal(FR.projects) },
  { provide: DESKTOP_TEXTS, useValue: signal(FR.desktop) },
  { provide: PROFILE_TEXTS, useValue: signal(FR.profile) },
  { provide: PAGES_TEXTS, useValue: signal(FR.pages) },
  {
    provide: LINKS,
    useValue: {
      home: () => pathOf('home', 'fr'),
      index: () => pathOf('index', 'fr'),
      about: () => pathOf('about', 'fr'),
      sheet: (slug: string) => pathOf('sheet', 'fr', slug),
    },
  },
];
