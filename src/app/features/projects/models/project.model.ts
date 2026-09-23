/**
 * Where a project was made. It is the context a reader asks about, not a
 * category invented for filtering.
 */
export type ProjectFamily = 'professional' | 'personal';

/**
 * One project as the index and the home page name it. What can be checked
 * about it lives in `ProjectFacts`, and nowhere else.
 */
export interface Project {
  /** The address segment, and the identity: two projects never share one. */
  readonly slug: string;
  readonly title: string;
  /** The name where room is short: a planet label, a home-page marker. */
  readonly short: string;
  /** One word of status: published, open source, prototype… */
  readonly tag: string;
  readonly family: ProjectFamily;
  /** What the project is, in a sentence, shown when its index row opens. */
  readonly subject: string;
  /** The same, in a few words, for the home-page preview. */
  readonly summary: string;
}

/**
 * How far a reader can check a project by themself. Said in words to the
 * reader (see the catalog's labels), because that is the question a
 * recruiter asks.
 */
export type ProofLevel = 'public' | 'indirect' | 'none';

/**
 * What can be checked about a project, what was held in it, with what. The
 * single source of these facts: the home rule, the index, the preview and
 * the sheet all read this table, and a sheet never repeats them.
 */
export interface ProjectFacts {
  readonly proof: string;
  readonly proofLevel: ProofLevel;
  readonly role: string;
  readonly stack: string;
  readonly context: string;
}

/** A project row with its facts joined, as the index and the preview draw it. */
export interface ProjectWithFacts extends Project {
  readonly facts: ProjectFacts;
}
