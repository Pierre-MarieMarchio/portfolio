import { Resolved, Text } from '@app/core/rules';

/*
 * A sheet as its project's file writes it (`…Source`, every text a `Text`,
 * both languages side by side, D5), and as the views read it, in the
 * reader's language: the same shape, `Resolved`.
 */

/** An outbound link of a sheet: a short label and where it leads. */
export interface DetailLinkSource {
  readonly label: Text;
  readonly href: string;
}

/** A term and what it means, in a chapter's list. */
export interface DetailBulletSource {
  readonly term: Text;
  readonly text: Text;
}

/** One row of the layers diagram: a layer and the projects it holds. */
export interface DetailLayerSource {
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
export type DetailFigureSource =
  | {
      readonly kind: 'flow';
      readonly steps: readonly Text[];
      readonly loop: Text;
      readonly caption: Text;
    }
  | {
      readonly kind: 'layers';
      readonly layers: readonly DetailLayerSource[];
      readonly caption: Text;
    };

/**
 * One chapter of a detail. Its title is optional: an untitled chapter takes
 * the default title of its position.
 */
export interface DetailChapterSource {
  readonly title?: Text;
  readonly paragraphs: readonly Text[];
  readonly bullets?: readonly DetailBulletSource[];
  readonly figure?: DetailFigureSource;
}

/**
 * A project's sheet: its prose, and nothing a fact already says. The
 * identity list of the first chapter (access, role, stack, context) is read
 * from the facts: a second table here once drifted from the first. Its title
 * is the project's.
 */
export interface DetailSource {
  /** The standfirst under the title. */
  readonly lede: Text;
  readonly links: readonly DetailLinkSource[];
  readonly chapters: readonly DetailChapterSource[];
}

export type DetailLink = Resolved<DetailLinkSource>;
export type DetailBullet = Resolved<DetailBulletSource>;
export type DetailLayer = Resolved<DetailLayerSource>;
export type DetailFigure = Resolved<DetailFigureSource>;
export type DetailChapter = Resolved<DetailChapterSource>;
export type ProjectDetail = Resolved<DetailSource>;
