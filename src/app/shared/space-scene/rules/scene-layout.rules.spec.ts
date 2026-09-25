import { ScenePanelRole } from '../models/scene-layout.model';
import { PanelAnchor, sceneLayout } from './scene-layout.rules';

const anchor = (
  role: ScenePanelRole,
  rect: { left: number; top: number; width: number; height: number },
  opacity = '1',
): PanelAnchor => ({
  rect: {
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
  },
  opacity,
  role,
});

const CANVAS = { left: 4, top: 8 };
const VIEWPORT = { width: 1280, height: 800 };

describe('sceneLayout', () => {
  it('lays every anchor out as a panel, in order, with its opacity', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('', { left: 10, top: 20, width: 100, height: 50 }, '0.5'),
      anchor('top-bar', { left: 0, top: 0, width: 1280, height: 64 }),
    ]);

    expect(layout.canvas).toEqual(CANVAS);
    expect(layout.viewport).toEqual(VIEWPORT);
    expect(layout.panels).toEqual([
      { left: 10, top: 20, right: 110, bottom: 70, opacity: 0.5 },
      { left: 0, top: 0, right: 1280, bottom: 64, opacity: 1 },
    ]);
  });

  it('reads an opacity it cannot parse as fully opaque', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('', { left: 0, top: 0, width: 10, height: 10 }, ''),
    ]);

    expect(layout.panels[0]?.opacity).toBe(1);
  });

  it('bounds the frame by the bar heights and the approach and close-up edges', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('top-bar', { left: 0, top: 0, width: 1280, height: 63.6 }),
      anchor('bottom-bar', { left: 0, top: 700, width: 1280, height: 40.4 }),
      anchor('approach-edge', {
        left: 720.6,
        top: 80,
        width: 500,
        height: 600,
      }),
      anchor('close-up-edge', {
        left: 900.25,
        top: 80,
        width: 300,
        height: 400,
      }),
    ]);

    expect(layout).toMatchObject({
      topBarHeight: 64,
      bottomBarHeight: 40,
      approachEdge: 721,
      closeUpEdge: 900.25,
    });
  });

  it('leaves a bound unset when no anchor with its role shows', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('top-bar', { left: 0, top: 0, width: 0, height: 64 }),
      anchor('approach-edge', { left: 700, top: 80, width: 500, height: 0 }),
      anchor('', { left: 0, top: 0, width: 10, height: 10 }),
    ]);

    expect(layout).toMatchObject({
      topBarHeight: null,
      bottomBarHeight: null,
      approachEdge: null,
      closeUpEdge: null,
    });
    expect(layout.panels).toHaveLength(3);
  });

  it('takes the last anchor that shows when two share a role', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('top-bar', { left: 0, top: 0, width: 1280, height: 64 }),
      anchor('top-bar', { left: 0, top: 0, width: 1280, height: 48 }),
      anchor('top-bar', { left: 0, top: 0, width: 0, height: 0 }),
    ]);

    expect(layout.topBarHeight).toBe(48);
  });

  describe('a panel along the bottom', () => {
    const PHONE = { width: 390, height: 844 };

    it('reads a full-width panel whose top is below the middle as a band, and keeps its top', () => {
      const layout = sceneLayout(CANVAS, PHONE, [
        anchor('approach-edge', {
          left: 0,
          top: 506.4,
          width: 390,
          height: 338,
        }),
        anchor('close-up-edge', {
          left: 12,
          top: 430,
          width: 366,
          height: 400,
        }),
      ]);

      expect(layout).toMatchObject({
        approachBandTop: 506.4,
        closeUpBandTop: 430,
      });
    });

    it('does not read a panel on the right as a band', () => {
      const layout = sceneLayout(CANVAS, VIEWPORT, [
        anchor('approach-edge', {
          left: 640,
          top: 500,
          width: 640,
          height: 300,
        }),
      ]);

      expect(layout.approachBandTop).toBeNull();
      expect(layout.approachEdge).toBe(640);
    });

    it('does not read a full-width panel risen above the middle as a band', () => {
      const layout = sceneLayout(CANVAS, PHONE, [
        anchor('approach-edge', { left: 0, top: 12, width: 390, height: 832 }),
      ]);

      expect(layout.approachBandTop).toBeNull();
    });
  });

  describe('an open window, whatever its role', () => {
    const PHONE = { width: 390, height: 844 };
    const TABLET = { width: 820, height: 1180 };

    it('keeps the top of the highest window along the bottom', () => {
      const layout = sceneLayout(CANVAS, PHONE, [
        anchor('', { left: 0, top: 506, width: 390, height: 338 }),
        anchor('approach-edge', { left: 0, top: 600, width: 390, height: 244 }),
      ]);

      expect(layout.panelBandTop).toBe(506);
    });

    it('leaves the bars and the empty slots out of the band', () => {
      const layout = sceneLayout(CANVAS, PHONE, [
        anchor('bottom-bar', { left: 0, top: 540, width: 390, height: 220 }),
        anchor('', { left: 0, top: 506, width: 390, height: 0 }),
      ]);

      expect(layout.panelBandTop).toBeNull();
    });

    it('reads a tall window on the right of an upright screen as a side panel', () => {
      const layout = sceneLayout(CANVAS, TABLET, [
        anchor('', { left: 317, top: 106, width: 470, height: 920 }),
        anchor('', { left: 597, top: 1100, width: 190, height: 52 }),
      ]);

      expect(layout.sidePanelLeft).toBe(317);
      expect(layout.panelBandTop).toBeNull();
    });

    it('reads no side panel on a screen lying down', () => {
      const layout = sceneLayout(CANVAS, VIEWPORT, [
        anchor('', { left: 540, top: 90, width: 700, height: 600 }),
      ]);

      expect(layout.sidePanelLeft).toBeNull();
    });
  });
});

describe('sceneLayout, the chrome', () => {
  it('keeps the bars and the chrome, shown, apart from the windows', () => {
    const layout = sceneLayout(CANVAS, VIEWPORT, [
      anchor('top-bar', { left: 0, top: 0, width: 640, height: 56 }),
      anchor('chrome', { left: 30, top: 70, width: 350, height: 90 }),
      anchor('chrome', { left: 0, top: 700, width: 0, height: 0 }),
      anchor('', { left: 700, top: 60, width: 500, height: 600 }),
      anchor('bottom-bar', { left: 640, top: 600, width: 600, height: 150 }),
    ]);

    expect(layout.chrome).toEqual([
      { left: 0, top: 0, right: 640, bottom: 56, opacity: 1 },
      { left: 30, top: 70, right: 380, bottom: 160, opacity: 1 },
      { left: 640, top: 600, right: 1240, bottom: 750, opacity: 1 },
    ]);
  });
});
