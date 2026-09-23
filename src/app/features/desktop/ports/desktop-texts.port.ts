import { InjectionToken, Signal } from '@angular/core';

export interface DesktopTexts {
  readonly animation: {
    readonly pause: string;
    readonly resume: string;
  };
  readonly object: {
    readonly select: (number: string, title: string) => string;
    readonly preview: (title: string) => string;
    readonly parts: readonly string[];
  };
  readonly home: {
    readonly void: string;
    readonly name: string;
    readonly trade: string;
    readonly status: string;
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

export const DESKTOP_TEXTS = new InjectionToken<Signal<DesktopTexts>>(
  'DESKTOP_TEXTS',
);
