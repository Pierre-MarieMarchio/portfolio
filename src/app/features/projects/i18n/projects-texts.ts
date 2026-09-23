import { InjectionToken, Signal } from '@angular/core';
import { ProjectFamily, ProofLevel } from '../models';

/**
 * The words of the projects' views, in the reader's language: the index,
 * the preview, the sheet and the rule. What a project itself says is in its
 * own file (D5); these are the frames around it. A count or a title arrives
 * already formatted.
 */
export interface ProjectsTexts {
  /** The proof level said in words: it is the question a recruiter asks. */
  readonly proofLevels: Readonly<Record<ProofLevel, string>>;
  /**
   * The title of an untitled chapter, by position. A sheet may carry fewer
   * chapters and name its own: three written chapters beat four with an
   * empty one.
   */
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

/** No default: a composition that forgets it fails loudly. */
export const PROJECTS_TEXTS = new InjectionToken<Signal<ProjectsTexts>>(
  'PROJECTS_TEXTS',
);
