import type { SceneAnchorKind } from '@app/features/common';

export const SCENE_ANCHORS: {
  readonly [K in Exclude<SceneAnchorKind, 'line'>]: K;
} = {
  panel: 'panel',
  head: 'head',
  rule: 'rule',
  detail: 'detail',
  preview: 'preview',
  chrome: 'chrome',
};
