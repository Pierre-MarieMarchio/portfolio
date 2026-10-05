import type { SceneLayout } from '../../../models/scene-layout.model';
import { NO_STATE, SceneState } from '../../scene-state.rules';
import { mirroredFrame, planetTurnOf } from '../../rooms/window-room.rules';
import { skyRoomsOf } from './body-framing.rules';
import { framingFor, framingScene, HoleFocusRules } from './framing.rules';
import { REST_FRAME } from '../camera-frames.rules';
import { BARE_BOUNDS } from '@testing/fixtures/scene-layout.fixture';

const DESKTOP = { width: 1440, height: 900 } as const;

const layoutWithWindow = (
  spans: readonly (readonly [number, number])[],
): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport: DESKTOP,
  panels: [],
  topBarHeight: 78,
  bottomBarHeight: null,
  approachEdge: null,
  closeUpEdge: null,
  ...BARE_BOUNDS,
  windows: spans.map(([left, right]) => ({
    left,
    top: 104,
    right,
    bottom: 824,
  })),
});

const orbit = { k: 1, rb: 5.2, inc: 0, ang: 0.4, v: 0.01 };

const approaching: SceneState = {
  ...NO_STATE,
  framing: 'approach',
  framed: 0,
  step: 1,
};

const sceneAt = (layout: SceneLayout) => {
  const scene = framingScene(
    REST_FRAME,
    () => 0,
    () => ({ w: 0, h: 0 }),
  );
  scene.dims = { w: DESKTOP.width, h: DESKTOP.height, dpr: 1 };
  scene.orbits = [orbit];
  scene.phase = 3;
  scene.azim = 0;
  scene.layout = layout;
  return scene;
};

const FRAME_DT = 1 / 60;

describe('framingFor beside a window that crosses the screen', () => {
  it('mirrors the position at once, but turns the tilt and the planet angle gradually', () => {
    const scene = sceneAt(layoutWithWindow([[900, 1396]]));
    const settledOnTheLeft = framingFor(approaching, scene);
    const wouldBeMirrored = mirroredFrame(
      settledOnTheLeft,
      planetTurnOf(approaching, scene),
    );

    scene.layout = layoutWithWindow([[44, 714]]);
    const first = framingFor(approaching, scene, FRAME_DT);

    expect(first.x).toBeCloseTo(wouldBeMirrored.x, 9);
    expect(Math.abs(first.i - settledOnTheLeft.i)).toBeLessThan(0.02);
    expect(first.i).not.toBeCloseTo(wouldBeMirrored.i, 2);
    expect(first.az).not.toBeCloseTo(wouldBeMirrored.az, 2);
  });

  it('reaches the mirrored tilt and planet angle once the turn has had time', () => {
    const scene = sceneAt(layoutWithWindow([[900, 1396]]));
    const settledOnTheLeft = framingFor(approaching, scene);
    const wouldBeMirrored = mirroredFrame(
      settledOnTheLeft,
      planetTurnOf(approaching, scene),
    );

    scene.layout = layoutWithWindow([[44, 714]]);
    let frame = settledOnTheLeft;
    for (let k = 0; k < 600; k++) {
      frame = framingFor(approaching, scene, FRAME_DT);
    }

    expect(frame.i).toBeCloseTo(wouldBeMirrored.i, 9);
    expect(frame.az).toBeCloseTo(wouldBeMirrored.az, 9);
  });

  it('never turns the tilt or the planet angle faster than an ordinary reframe of the same side', () => {
    const scene = sceneAt(layoutWithWindow([[900, 1396]]));
    let previous = framingFor(approaching, scene);
    scene.layout = layoutWithWindow([[44, 714]]);
    let maxStep = 0;
    for (let k = 0; k < 60; k++) {
      const next = framingFor(approaching, scene, FRAME_DT);
      maxStep = Math.max(
        maxStep,
        Math.abs(next.i - previous.i),
        Math.abs(next.az - previous.az),
      );
      previous = next;
    }

    expect(maxStep).toBeLessThan(0.6 / 60 + 1e-9);
  });
});

const rulesGiving = (room: { left: number; right: number }) =>
  ({
    skyRooms: () => [{ ...room, top: 0, bottom: 400 }],
  }) as unknown as HoleFocusRules;

describe('skyRoomsOf', () => {
  it('keeps the very same rooms when the panels are laid out again at the same places', () => {
    const scene = sceneAt(layoutWithWindow([[900, 1396]]));
    const first = skyRoomsOf(scene, rulesGiving({ left: 0, right: 880 }));

    scene.layout = layoutWithWindow([[900, 1396]]);
    const again = skyRoomsOf(scene, rulesGiving({ left: 0, right: 880 }));

    expect(again).toBe(first);
  });

  it('gives new rooms once a panel has moved', () => {
    const scene = sceneAt(layoutWithWindow([[900, 1396]]));
    const first = skyRoomsOf(scene, rulesGiving({ left: 0, right: 880 }));

    scene.layout = layoutWithWindow([[700, 1396]]);
    const moved = skyRoomsOf(scene, rulesGiving({ left: 0, right: 680 }));

    expect(moved).not.toBe(first);
    expect(moved[0]?.right).toBe(680);
  });
});
