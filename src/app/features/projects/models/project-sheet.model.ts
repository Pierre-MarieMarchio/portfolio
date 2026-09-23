import { Resolved, Text } from '@app/core/rules';

/*
 * A sheet as its project's file writes it (`…Source`, every text a `Text`,
 * both languages side by side, D5), and as the views read it, in the
 * reader's language: the same shape, `Resolved`.
 */

/** An outbound link of a sheet: a short label and where it leads. */
export interface SheetLinkSource {
  readonly label: Text;
  readonly href: string;
}

/** A term and what it means, in a chapter's list. */
export interface SheetBulletSource {
  readonly term: Text;
  readonly text: Text;
}

/** One row of the layers diagram: a layer and the projects it holds. */
export interface SheetLayerSource {
  readonly name: Text;
  readonly projects: Text;
}

/**
 * A reading diagram, carried by its chapter with its caption. A schema,
 * never a screenshot presented as proof.
 *
 * - `flow`: steps in sequence, then what they loop back into;
 * - `layers`: the layers of an architecture and what each holds.
 */
export type SheetFigureSource =
  | {
      readonly kind: 'flow';
      readonly steps: readonly Text[];
      readonly loop: Text;
      readonly caption: Text;
    }
  | {
      readonly kind: 'layers';
      readonly layers: readonly SheetLayerSource[];
      readonly caption: Text;
    };

/**
 * One approach of a sheet. Its title is optional: an untitled chapter takes
 * the default title of its position.
 */
export interface SheetChapterSource {
  readonly title?: Text;
  readonly paragraphs: readonly Text[];
  readonly bullets?: readonly SheetBulletSource[];
  readonly figure?: SheetFigureSource;
}

/**
 * A project's sheet: its prose, and nothing a fact already says. The
 * identity list of the first chapter (access, role, stack, context) is read
 * from the facts: a second table here once drifted from the first. Its title
 * is the project's.
 */
export interface SheetSource {
  /** The standfirst under the title. */
  readonly lede: Text;
  readonly links: readonly SheetLinkSource[];
  readonly chapters: readonly SheetChapterSource[];
}

export type SheetLink = Resolved<SheetLinkSource>;
export type SheetBullet = Resolved<SheetBulletSource>;
export type SheetLayer = Resolved<SheetLayerSource>;
export type SheetFigure = Resolved<SheetFigureSource>;
export type SheetChapter = Resolved<SheetChapterSource>;
export type ProjectSheet = Resolved<SheetSource>;
