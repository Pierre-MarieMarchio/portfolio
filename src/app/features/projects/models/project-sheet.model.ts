/** An outbound link of a sheet: a short label and where it leads. */
export interface SheetLink {
  readonly label: string;
  readonly href: string;
}

/** A term and what it means, in a chapter's list. */
export interface SheetBullet {
  readonly term: string;
  readonly text: string;
}

/**
 * A reading diagram, carried by its chapter with its caption. A schema,
 * never a screenshot presented as proof.
 *
 * - `flow`: steps in sequence, then what they loop back into;
 * - `layers`: the layers of an architecture and what each holds.
 */
export type SheetFigure =
  | {
      readonly kind: 'flow';
      readonly steps: readonly string[];
      readonly loop: string;
      readonly caption: string;
    }
  | {
      readonly kind: 'layers';
      readonly layers: readonly SheetLayer[];
      readonly caption: string;
    };

/**
 * One approach of a sheet. Its title is optional: an untitled chapter takes
 * the default title of its position.
 */
export interface SheetChapter {
  readonly title?: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly SheetBullet[];
  readonly figure?: SheetFigure;
}

/**
 * A project's sheet: its prose, and nothing a fact already says. The
 * identity list of the first chapter (access, role, stack, context) is read
 * from `ProjectFacts`: a second table here once drifted from the first. Its
 * title is the project's.
 */
export interface ProjectSheet {
  /** The standfirst under the title. */
  readonly lede: string;
  readonly links: readonly SheetLink[];
  readonly chapters: readonly SheetChapter[];
}

/** One row of the layers diagram: a layer and the projects it holds. */
export interface SheetLayer {
  readonly name: string;
  readonly projects: string;
}
