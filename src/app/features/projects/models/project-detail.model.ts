import { Resolved, Text } from '@app/core/rules';

interface DetailLinkSource {
  readonly label: Text;
  readonly href: string;
}

interface DetailBulletSource {
  readonly term: Text;
  readonly text: Text;
}

interface DetailLayerSource {
  readonly name: Text;
  readonly projects: Text;
}

type DetailFigureSource =
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

interface DetailChapterSource {
  readonly title?: Text;
  readonly paragraphs: readonly Text[];
  readonly bullets?: readonly DetailBulletSource[];
  readonly figure?: DetailFigureSource;
}

export interface DetailSource {
  readonly lede: Text;
  readonly links: readonly DetailLinkSource[];
  readonly chapters: readonly DetailChapterSource[];
}

export type DetailChapter = Resolved<DetailChapterSource>;
export type ProjectDetail = Resolved<DetailSource>;
