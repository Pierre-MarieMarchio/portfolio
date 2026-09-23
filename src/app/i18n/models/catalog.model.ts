import { InjectionToken, Signal } from '@angular/core';
import { ProjectsTexts } from '@app/features/projects/ports';
import { DesktopTexts } from '@app/features/desktop/ports';
import { ProfileTexts } from '@app/features/profile/ports';
import { SharedTexts } from '@shared/ui/ports';
import { WindowTexts } from '@shared/windows/ports';

/** What a view says about itself in the head: its title and description. */
export interface ViewHead {
  readonly title: string;
  readonly description: string;
}

/**
 * The words of the composition itself: the head of each view, the shell,
 * the station's own windows and cards. Only `pages/` and the composition
 * root read them.
 */
export interface PagesTexts {
  readonly heads: {
    readonly home: ViewHead;
    readonly index: ViewHead;
    readonly about: ViewHead;
    readonly notFound: { readonly title: string };
    /** The sheet's word, before its project is known or when none is. */
    readonly sheet: { readonly title: string };
  };
  readonly skipLink: string;
  readonly navigation: {
    readonly home: string;
    readonly index: string;
    readonly about: string;
  };
  /** The languages, each named in itself, as the page bar offers them. */
  readonly languages: Readonly<Record<'fr' | 'en', string>>;
}

/**
 * Every text of the interface, in one language. `fr.ts` and `en.ts` each
 * implement it whole: a key missing in either does not compile (D3). Each
 * layer reads its own slice through its own token, never the whole.
 */
export interface Catalog {
  readonly shared: SharedTexts;
  readonly windows: WindowTexts;
  readonly projects: ProjectsTexts;
  readonly desktop: DesktopTexts;
  readonly profile: ProfileTexts;
  readonly pages: PagesTexts;
}

/** The pages' slice, for `pages/` and the composition root. */
export const PAGES_TEXTS = new InjectionToken<Signal<PagesTexts>>(
  'PAGES_TEXTS',
);
