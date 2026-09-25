import type { PanelRect, SceneLayout } from '../../models/scene-layout.model';
import { referenceRadius } from './camera-frames.rules';
import { measureRest, RestMeasure } from './rest-frame.rules';
import { restInFreeSky } from './free-sky.rules';

type Box = readonly [left: number, top: number, right: number, bottom: number];

const rect = ([left, top, right, bottom]: Box): PanelRect => ({
  left,
  top,
  right,
  bottom,
  opacity: 1,
});

const layoutOf = (
  viewport: SceneLayout['viewport'],
  chrome: readonly Box[],
  ruleHeight = 133,
): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport,
  panels: chrome.map((box) => rect(box)),
  topBarHeight: 56,
  bottomBarHeight: ruleHeight,
  approachEdge: null,
  closeUpEdge: null,
  chrome: chrome.map((box) => rect(box)),
});

const holeOf = (
  rest: RestMeasure,
  viewport: SceneLayout['viewport'],
): { x: number; y: number; radius: number } => ({
  x: rest.x * viewport.width,
  y: rest.y * viewport.height,
  radius: referenceRadius(viewport.width, viewport.height, rest.s),
});

const isMeeting = (
  hole: { x: number; y: number; radius: number },
  [left, top, right, bottom]: Box,
): boolean =>
  Math.hypot(
    hole.x - Math.min(Math.max(hole.x, left), right),
    hole.y - Math.min(Math.max(hole.y, top), bottom),
  ) < hole.radius;

const restOf = (layout: SceneLayout): RestMeasure =>
  restInFreeSky(
    layout,
    measureRest(layout.viewport, layout.topBarHeight, layout.bottomBarHeight),
  );

const LYING_PHONE = { width: 844, height: 390 };
const LYING_CHROME: readonly Box[] = [
  [0, 0, 422, 56],
  [34, 68, 382, 163],
  [372, 340, 416, 384],
  [428, 251, 832, 384],
];

const UPRIGHT_PHONE = { width: 320, height: 568 };
const UPRIGHT_CHROME: readonly Box[] = [
  [0, 0, 320, 56],
  [20, 68, 320, 207],
  [20, 357, 300, 490],
];

describe('restInFreeSky', () => {
  it('keeps the band between the bars when it holds the hole clear of the chrome', () => {
    const viewport = { width: 1440, height: 900 };
    const layout = layoutOf(
      viewport,
      [
        [900, 36, 1400, 80],
        [60, 300, 560, 520],
        [60, 780, 1380, 870],
      ],
      90,
    );
    const band = measureRest(viewport, 56, 90);

    expect(restInFreeSky(layout, band)).toBe(band);
  });

  it('keeps the band when there is no chrome to avoid', () => {
    const band = measureRest(LYING_PHONE, 56, 133);

    expect(restInFreeSky(null, band)).toBe(band);
    expect(restInFreeSky(layoutOf(LYING_PHONE, []), band)).toBe(band);
  });

  it('moves the rest of a phone lying down into the largest free sky', () => {
    const layout = layoutOf(LYING_PHONE, LYING_CHROME);
    const band = measureRest(LYING_PHONE, 56, 133);

    const rest = restOf(layout);
    const hole = holeOf(rest, LYING_PHONE);

    expect(hole.radius).toBeGreaterThan(3 * holeOf(band, LYING_PHONE).radius);
    expect(LYING_CHROME.filter((box) => isMeeting(hole, box))).toEqual([]);
    expect(hole.x).toBeGreaterThan(LYING_PHONE.width / 2);
    expect(rest.sideHalf).toBeDefined();
  });

  it('starts the rest of an upright phone below its title', () => {
    const rest = restOf(layoutOf(UPRIGHT_PHONE, UPRIGHT_CHROME));
    const hole = holeOf(rest, UPRIGHT_PHONE);

    expect(UPRIGHT_CHROME.filter((box) => isMeeting(hole, box))).toEqual([]);
    expect(hole.y - hole.radius).toBeGreaterThan(207);
  });
});
