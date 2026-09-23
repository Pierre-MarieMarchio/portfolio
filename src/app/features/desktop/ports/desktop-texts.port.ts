import { InjectionToken, Signal } from '@angular/core';

/**
 * The words the object says: the accessible name of each planet, and the
 * names it draws in the sky for the parts of "about".
 */
export interface DesktopTexts {
  readonly object: {
    /** A planet of the index: it selects its row. */
    readonly select: (number: string, title: string) => string;
    /** A planet of the home page: it opens its preview. */
    readonly preview: (title: string) => string;
    /** The constellation of each part of "about", in the parts' order. */
    readonly parts: readonly string[];
  };
  readonly home: {
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
}

/** No default: a composition that forgets it fails loudly. */
export const DESKTOP_TEXTS = new InjectionToken<Signal<DesktopTexts>>(
  'DESKTOP_TEXTS',
);
