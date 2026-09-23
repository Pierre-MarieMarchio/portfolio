import { InjectionToken, Signal } from '@angular/core';
import { ProjectsTexts } from '@app/features/projects/ports';
import { DesktopTexts } from '@app/features/desktop/ports';
import { SharedTexts } from '@shared/ui/ports';

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
  readonly contact: {
    readonly email: string;
    readonly linkedin: string;
    readonly github: string;
  };
  readonly station: {
    readonly void: string;
    readonly name: string;
    readonly trade: string;
    readonly brand: string;
  };
  readonly notFound: {
    readonly heading: string;
    readonly label: string;
    readonly title: string;
    readonly sentence: (count: string) => string;
    readonly back: string;
  };
  readonly about: {
    readonly heading: string;
    readonly label: string;
    readonly parts: string;
    /** The h1, which names the part on show. */
    readonly title: (part: string) => string;
    readonly goTo: (part: string) => string;
    readonly next: (part: string) => string;
    readonly back: string;
    readonly profile: {
      readonly label: string;
      readonly title: string;
      readonly lead: string;
      readonly facts: readonly {
        readonly term: string;
        readonly value: string;
        readonly tone: 'text' | 'data' | 'quiet';
      }[];
      readonly prose: readonly string[];
    };
    readonly skills: {
      readonly label: string;
      readonly title: string;
      readonly heading: string;
      readonly domains: readonly {
        readonly label: string;
        readonly value: string;
      }[];
      readonly prose: string;
    };
    readonly method: {
      readonly label: string;
      readonly title: string;
      readonly heading: string;
      readonly steps: readonly string[];
    };
    readonly path: {
      readonly label: string;
      readonly title: string;
      readonly heading: string;
      readonly missing: string;
      readonly milestones: readonly {
        readonly year: string;
        readonly fact: string;
      }[];
    };
  };
}

/**
 * Every text of the interface, in one language. `fr.ts` and `en.ts` each
 * implement it whole: a key missing in either does not compile (D3). Each
 * layer reads its own slice through its own token, never the whole.
 */
export interface Catalog {
  readonly shared: SharedTexts;
  readonly projects: ProjectsTexts;
  readonly station: DesktopTexts;
  readonly pages: PagesTexts;
}

/** The pages' slice, for `pages/` and the composition root. */
export const PAGES_TEXTS = new InjectionToken<Signal<PagesTexts>>(
  'PAGES_TEXTS',
);
