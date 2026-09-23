import { InjectionToken, Signal } from '@angular/core';

export interface ProfileTexts {
  readonly about: {
    readonly heading: string;
    readonly label: string;
    readonly parts: string;
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
      readonly contact: string;
    };
    readonly path: {
      readonly label: string;
      readonly title: string;
      readonly heading: string;
      readonly milestones: readonly {
        readonly year: string;
        readonly fact: string;
      }[];
    };
  };
  readonly contact: {
    readonly email: string;
    readonly linkedin: string;
    readonly github: string;
    readonly cv: string;
  };
}

export const PROFILE_TEXTS = new InjectionToken<Signal<ProfileTexts>>(
  'PROFILE_TEXTS',
);
