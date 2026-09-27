import type { PanelRect, SceneLayout } from '../../models/scene-layout.model';
import { referenceRadius } from './camera-frames.rules';
import { closeUpClearOfChrome } from './framing.rules';

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
): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport,
  panels: chrome.map((box) => rect(box)),
  topBarHeight: 56,
  bottomBarHeight: null,
  approachEdge: null,
  closeUpEdge: null,
  chrome: chrome.map((box) => rect(box)),
});

describe('closeUpClearOfChrome', () => {
  const PHONE = { width: 320, height: 568 };
  const TITLE: Box = [20, 68, 320, 207];
  const GLASS_TOP = 312;
  const PLANET_REACH = 24;
  const BELOW_LEFT = { nx: -1.6, ny: 1.8 };
  const closeUp = { x: 0.64, y: 0.23, s: 0.74, i: -0.45, ev: 0.6, az: 0 };

  it('moves the hole off the title, and keeps its planet above the glass', () => {
    const moved = closeUpClearOfChrome(layoutOf(PHONE, [TITLE]), closeUp, {
      bandTop: GLASS_TOP,
      offset: BELOW_LEFT,
    });

    expect(moved).not.toBeNull();
    const radius = referenceRadius(PHONE.width, PHONE.height, moved?.s ?? 0);
    const hole = {
      x: (moved?.x ?? 0) * PHONE.width,
      y: (moved?.y ?? 0) * PHONE.height,
    };
    const planetY = hole.y + BELOW_LEFT.ny * radius;
    expect(hole.y - radius).toBeGreaterThanOrEqual(207);
    expect(hole.y + radius).toBeLessThanOrEqual(GLASS_TOP);
    expect(planetY + PLANET_REACH).toBeLessThanOrEqual(GLASS_TOP);
    expect(moved?.s).toBeLessThan(closeUp.s);
  });

  it('leaves a close-up whose hole is already clear of the chrome', () => {
    const clear = { ...closeUp, y: 0.46 };
    const options = { bandTop: GLASS_TOP, offset: BELOW_LEFT };

    expect(
      closeUpClearOfChrome(layoutOf(PHONE, [TITLE]), clear, options),
    ).toBeNull();
    expect(
      closeUpClearOfChrome(layoutOf(PHONE, []), closeUp, options),
    ).toBeNull();
  });
});
