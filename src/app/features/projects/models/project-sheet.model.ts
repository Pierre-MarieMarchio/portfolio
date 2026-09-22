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
 * The two reading diagrams. They are schemas, never screenshots presented
 * as proof.
 */
export type SheetFigure = 'flow' | 'layers';

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
 * from `ProjectFacts`: a second table here once drifted from the first.
 */
export interface ProjectSheet {
  readonly title: string;
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
