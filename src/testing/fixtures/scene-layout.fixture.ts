import type { PanelRect, SceneLayout } from '@shared/space-scene/models';
import { referenceRadius } from '@shared/space-scene/rules/camera/camera-frames.rules';
import type { SkyRoom } from '@shared/space-scene/rules/figures/figure-room.rules';

export const ROOM: SkyRoom = { l: 8, t: 64, r: 382, b: 498 };

export const isInside = (inner: SkyRoom, outer: SkyRoom): boolean =>
  inner.l >= outer.l - 1e-6 &&
  inner.t >= outer.t - 1e-6 &&
  inner.r <= outer.r + 1e-6 &&
  inner.b <= outer.b + 1e-6;

export const isOverlapping = (a: SkyRoom, b: SkyRoom): boolean =>
  a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

export type Edges = readonly [
  left: number,
  top: number,
  right: number,
  bottom: number,
];

const rect = ([left, top, right, bottom]: Edges): PanelRect => ({
  left,
  top,
  right,
  bottom,
  opacity: 1,
});

export const BARE_BOUNDS: Pick<
  SceneLayout,
  | 'approachBandTop'
  | 'closeUpBandTop'
  | 'panelBandTop'
  | 'sidePanelLeft'
  | 'cornerPanelLeft'
  | 'cornerBandTop'
  | 'topBar'
  | 'chrome'
  | 'windows'
> = {
  approachBandTop: null,
  closeUpBandTop: null,
  panelBandTop: null,
  sidePanelLeft: null,
  cornerPanelLeft: null,
  cornerBandTop: null,
  topBar: null,
  chrome: [],
  windows: [],
};

export const UPRIGHT_PHONE = { width: 320, height: 568 };
export const UPRIGHT_BAR: Edges = [0, 0, 320, 56];
export const UPRIGHT_TITLE: Edges = [20, 68, 320, 207];

export const chromeLayout = (
  viewport: SceneLayout['viewport'],
  chrome: readonly Edges[],
  overrides: Partial<SceneLayout> = {},
): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport,
  panels: chrome.map((box) => rect(box)),
  topBarHeight: 56,
  bottomBarHeight: null,
  approachEdge: null,
  closeUpEdge: null,
  ...BARE_BOUNDS,
  chrome: chrome.map((box) => rect(box)),
  ...overrides,
});

export const holeOf = (
  frame: { readonly x: number; readonly y: number; readonly s: number },
  viewport: SceneLayout['viewport'],
  shrink = 1,
): { x: number; y: number; radius: number } => ({
  x: frame.x * viewport.width,
  y: frame.y * viewport.height,
  radius: referenceRadius(viewport.width, viewport.height, frame.s) * shrink,
});
