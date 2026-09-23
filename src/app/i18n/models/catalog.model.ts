import { InjectionToken, Signal } from '@angular/core';
import { Lang } from '@app/core/models';
import { ProjectsTexts } from '@app/features/projects/ports';
import { DesktopTexts } from '@app/features/desktop/ports';
import { ProfileTexts } from '@app/features/profile/ports';
import { SharedTexts } from '@shared/ui/ports';
import { WindowTexts } from '@shared/windows/ports';

interface ViewHead {
  readonly title: string;
  readonly description: string;
}

export interface PagesTexts {
  readonly heads: {
    readonly home: ViewHead;
    readonly index: ViewHead;
    readonly about: ViewHead;
    readonly notFound: { readonly title: string };
    readonly sheet: { readonly title: string };
  };
  readonly skipLink: string;
  readonly navigation: {
    readonly home: string;
    readonly index: string;
    readonly about: string;
  };
  readonly languages: Readonly<Record<Lang, string>>;
}

export interface Catalog {
  readonly shared: SharedTexts;
  readonly windows: WindowTexts;
  readonly projects: ProjectsTexts;
  readonly desktop: DesktopTexts;
  readonly profile: ProfileTexts;
  readonly pages: PagesTexts;
}

export const PAGES_TEXTS = new InjectionToken<Signal<PagesTexts>>(
  'PAGES_TEXTS',
);
