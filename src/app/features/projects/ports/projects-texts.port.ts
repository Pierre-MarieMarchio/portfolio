import { InjectionToken, Signal } from '@angular/core';
import { ProjectFamily, ProofLevel } from '../models';

export interface ProjectsTexts {
  readonly proofLevels: Readonly<Record<ProofLevel, string>>;
  readonly defaultChapterTitles: readonly string[];
  readonly index: {
    readonly heading: string;
    readonly label: string;
    readonly title: (count: string) => string;
    readonly count: (count: string) => string;
    readonly families: {
      readonly label: string;
      readonly all: { readonly label: string; readonly aria: string };
    } & Readonly<
      Record<ProjectFamily, { readonly label: string; readonly aria: string }>
    >;
    readonly summary: (professional: string, personal: string) => string;
    readonly columns: readonly [string, string, string, string];
    readonly read: string;
    readonly openSheet: string;
  };
  readonly preview: {
    readonly label: string;
    readonly bodies: string;
    readonly body: (number: string, title: string) => string;
    readonly terms: {
      readonly proof: string;
      readonly role: string;
      readonly stack: string;
    };
    readonly openSheet: string;
  };
  readonly sheet: {
    readonly label: string;
    readonly approaches: string;
    readonly approach: (number: string, title: string) => string;
    readonly terms: {
      readonly access: string;
      readonly role: string;
      readonly stack: string;
      readonly context: string;
    };
    readonly nextApproach: (title: string) => string;
    readonly nextProject: (short: string) => string;
  };
  readonly rule: {
    readonly heading: string;
    readonly all: string;
  };
}

export const PROJECTS_TEXTS = new InjectionToken<Signal<ProjectsTexts>>(
  'PROJECTS_TEXTS',
);
