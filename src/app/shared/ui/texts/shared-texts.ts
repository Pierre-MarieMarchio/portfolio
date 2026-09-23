import { InjectionToken, Signal } from '@angular/core';

/**
 * The words the shared components say themselves, whatever page uses them:
 * a window's controls, the page bar's groups, the contact rail's pause. They
 * know no language: the composition root answers this token with the
 * catalogue of the reader's, and every text a caller passes stays the
 * caller's.
 */
export interface SharedTexts {
  readonly window: {
    readonly pin: string;
    readonly unpin: string;
    readonly fold: string;
    readonly unfold: string;
    readonly close: string;
  };
  readonly segmented: {
    /** The group's name when the caller gives none. */
    readonly label: string;
  };
  readonly pageBar: {
    readonly languages: string;
    readonly navigation: string;
  };
  readonly contactRail: {
    readonly label: string;
    readonly pause: string;
    readonly resume: string;
  };
}

/** No default: a composition that forgets it fails loudly, not in French. */
export const SHARED_TEXTS = new InjectionToken<Signal<SharedTexts>>(
  'SHARED_TEXTS',
);
