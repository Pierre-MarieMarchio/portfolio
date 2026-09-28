import type { SceneLayout } from '../../models/scene-layout.model';
import { measureRest, RestMeasure } from './rest-frame.rules';
import { restInFreeSky } from './free-sky.rules';
import {
  chromeLayout,
  Edges,
  holeOf,
  UPRIGHT_BAR,
  UPRIGHT_PHONE,
  UPRIGHT_TITLE,
} from '@testing/fixtures/scene-layout.fixture';

const layoutOf = (
  viewport: SceneLayout['viewport'],
  chrome: readonly Edges[],
  ruleHeight = 133,
): SceneLayout =>
  chromeLayout(viewport, chrome, { bottomBarHeight: ruleHeight });

const isMeeting = (
  hole: { x: number; y: number; radius: number },
  [left, top, right, bottom]: Edges,
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
const LYING_CHROME: readonly Edges[] = [
  [0, 0, 422, 56],
  [34, 68, 382, 163],
  [372, 340, 416, 384],
  [428, 251, 832, 384],
];

const UPRIGHT_CHROME: readonly Edges[] = [
  UPRIGHT_BAR,
  UPRIGHT_TITLE,
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
