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
});
