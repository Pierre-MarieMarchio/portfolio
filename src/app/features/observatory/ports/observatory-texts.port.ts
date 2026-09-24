import { InjectionToken, Signal } from '@angular/core';
import { ObservatoryWindow } from '../models';

export interface ObservatoryTexts {
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
  readonly dock: {
    readonly label: string;
    readonly windows: Readonly<Record<ObservatoryWindow, string>>;
  };
  readonly notFound: {
    readonly heading: string;
    readonly label: string;
    readonly title: string;
    readonly sentence: (count: string) => string;
    readonly back: string;
  };
}

export const OBSERVATORY_TEXTS = new InjectionToken<Signal<ObservatoryTexts>>(
  'OBSERVATORY_TEXTS',
);
