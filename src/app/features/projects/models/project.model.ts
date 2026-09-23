import { Resolved, Text } from '@app/core/rules';
import { DetailSource } from './project-detail.model';
import { ProjectFamily } from './project-family.model';

/**
 * One project as the index and the home page name it, as its file writes
 * it: a `Text` reads the same in both languages when it is a plain string, a
 * pair otherwise (D5). What can be checked about it lives in the facts, and
 * nowhere else.
 */
export interface ProjectSource {
  /** The address segment, and the identity: two projects never share one. */
  readonly slug: string;
  readonly title: Text;
  /** The name where room is short: a planet label, a home-page marker. */
  readonly short: Text;
  /** One word of status: published, open source, prototype… */
  readonly tag: Text;
  readonly family: ProjectFamily;
  /** What the project is, in a sentence, shown when its index row opens. */
  readonly subject: Text;
  /** The same, in a few words, for the home-page preview. */
  readonly summary: Text;
}

/**
 * How far a reader can check a project by themself. Said in words to the
 * reader (see the catalogue's `proofLevels`), because that is the question a
 * recruiter asks.
 */
export type ProofLevel = 'public' | 'indirect' | 'none';

/**
 * What can be checked about a project, what was held in it, with what. The
 * single source of these facts: the home rule, the index, the preview and
 * the sheet all read this table, and a sheet never repeats them.
 */
export interface FactsSource {
  readonly proof: Text;
  readonly proofLevel: ProofLevel;
  readonly role: Text;
  readonly stack: Text;
  readonly context: Text;
}

/**
 * A project as it is written: its identity, its facts and its detail, in the
 * one file of that project. Every part is required, so a project without its
 * facts or its detail does not compile.
 */
export interface ProjectEntry {
  readonly project: ProjectSource;
  readonly facts: FactsSource;
  readonly detail: DetailSource;
}

/** A project in the reader's language. */
export type Project = Resolved<ProjectSource>;

/** Its facts in the reader's language. */
export type ProjectFacts = Resolved<FactsSource>;

export interface Ranking {
  readonly rank: number;
  readonly number: string;
  readonly featured: boolean;
}

export interface RankedProject extends Project, Ranking {
  readonly facts: ProjectFacts;
}
