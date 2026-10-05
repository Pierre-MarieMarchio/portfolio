import type { SceneLayout } from '../../models/scene-layout.model';
import { BARE_BOUNDS } from '@testing/fixtures/scene-layout.fixture';
import { REST_FRAME } from '../camera/camera-frames.rules';
import {
  layoutInRoom,
  holeKeptLeftOf,
  isHoleInRoom,
  mirroredFrame,
  mirrorTurnStep,
  sideOf,
  skyOfRoom,
  WindowRoom,
  windowRoomOf,
} from './window-room.rules';

const DESKTOP = { width: 1440, height: 900 } as const;

const layoutWith = (
  spans: readonly (readonly [number, number])[],
  bounds: Partial<SceneLayout> = {},
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
  ...bounds,
});

describe('windowRoomOf', () => {
  it.each([
    ['a window on the right', [[778, 1396]], { left: 0, right: 778 }],
    ['a window snapped left', [[44, 714]], { left: 714, right: 1440 }],
    ['a window left of the middle', [[300, 800]], { left: 800, right: 1440 }],
    ['a window right of the middle', [[640, 1140]], { left: 0, right: 640 }],
    [
      'a pinned window on the left, the view on the right',
      [
        [900, 1396],
        [44, 500],
      ],
      { left: 500, right: 900 },
    ],
    [
      'two windows over each other on the right',
      [
        [590, 1396],
        [778, 1396],
      ],
      { left: 0, right: 590 },
    ],
    ['a window half off the screen', [[-200, 300]], { left: 300, right: 1440 }],
    [
      'a window in the middle, the left first',
      [[620, 820]],
      { left: 0, right: 620 },
    ],
  ] as const)('keeps the widest free room beside %s', (_, spans, room) => {
    expect(windowRoomOf(layoutWith(spans), null)).toEqual(room);
  });

  it('has no room without a window', () => {
    expect(windowRoomOf(layoutWith([]), { left: 0, right: 700 })).toBeNull();
    expect(windowRoomOf({ ...layoutWith([]), windows: [] }, null)).toBeNull();
  });

  it('keeps the last room while a window covers the screen', () => {
    const last: WindowRoom = { left: 714, right: 1440 };

    expect(windowRoomOf(layoutWith([[44, 1396]]), last)).toBe(last);
    expect(windowRoomOf(layoutWith([[44, 1396]]), null)).toBeNull();
  });
});

describe('sideOf', () => {
  it.each([
    [{ left: 0, right: 778 }, 'left'],
    [{ left: 714, right: 1440 }, 'right'],
    [{ left: 500, right: 900 }, 'middle'],
  ] as const)('reads %o as the room on the %s', (room, side) => {
    expect(sideOf(room, DESKTOP.width)).toBe(side);
  });
});

describe('layoutInRoom', () => {
  it('keeps the edges of a single window on the right', () => {
    const layout = layoutWith([[778.4, 1396]], {
      approachEdge: 778,
      closeUpEdge: 906,
    });

    expect(layoutInRoom(layout, { left: 0, right: 778.4 })).toMatchObject({
      approachEdge: 778,
      closeUpEdge: 778.4,
    });
  });

  it('reads the free room of a window on the left as if it were on the right', () => {
    const layout = layoutWith([[44, 714]], { approachEdge: 44 });

    expect(layoutInRoom(layout, { left: 714, right: 1440 })).toMatchObject({
      approachEdge: 726,
      closeUpEdge: 726,
      sidePanelLeft: null,
    });
  });

  it('gives a room between two windows as a free sky, below the bar', () => {
    const layout = layoutWith([
      [44, 500],
      [900, 1396],
    ]);

    expect(skyOfRoom(layout, { left: 500, right: 900 })).toEqual({
      left: 516,
      right: 884,
      top: 78,
      bottom: 900,
    });
  });
});

describe('the hole in its room', () => {
  const dims = { w: 1440, h: 900, dpr: 1 };

  it('mirrors a framing, the framed planet across', () => {
    const frame = { ...REST_FRAME, x: 0.2, i: -0.3, az: 1 };
    const mirrored = mirroredFrame(frame, { angle: 0.5, azim: 0 });

    expect(mirrored).toMatchObject({ x: 0.8, i: 0.3, y: frame.y, s: frame.s });
    expect(0.5 + mirrored.az).toBeCloseTo(Math.PI - (0.5 + frame.az), 9);
    expect(mirroredFrame(frame, null).az).toBe(frame.az);
  });

  it('starts on the target the first time, without an old turn to leave', () => {
    expect(mirrorTurnStep(null, { i: 0.3, az: 1 }, 1 / 60)).toEqual({
      i: 0.3,
      az: 1,
    });
  });

  it('turns toward the mirror instead of jumping there in one frame', () => {
    const target = { i: 0.3, az: -0.3 };
    const stepped = mirrorTurnStep({ i: -0.3, az: 1 }, target, 1 / 60);

    expect(Math.abs(stepped.i - -0.3)).toBeLessThan(0.6);
    expect(stepped.i).not.toBe(target.i);
    expect(Math.abs(stepped.az - 1)).toBeLessThan(1.3);
    expect(stepped.az).not.toBe(target.az);
  });

  it('reaches the target once the turn has had enough time', () => {
    let turn = { i: -0.3, az: 1 };
    const target = { i: 0.3, az: -0.3 };
    for (let k = 0; k < 600; k++) {
      turn = mirrorTurnStep(turn, target, 1 / 60);
    }

    expect(turn).toEqual(target);
  });

  it('holds the hole left of the edge of its window, and only if it crosses it', () => {
    const layout = layoutWith([[800, 1396]], {
      approachEdge: 800,
      closeUpEdge: 900,
    });
    const kept = holeKeptLeftOf(REST_FRAME, layout, {
      dims,
      framing: 'approach',
    });
    const radius = Math.min(1440 / 6.6, 900 / 3.2) * REST_FRAME.s;

    expect(kept.x * 1440 + radius).toBeCloseTo(800, 9);
    expect(
      holeKeptLeftOf(REST_FRAME, layout, { dims, framing: 'close-up' }),
    ).toBe(REST_FRAME);
  });

  it.each([
    [{ left: 0, right: 1100 }, true],
    [{ left: 714, right: 1440 }, false],
    [{ left: 0, right: 800 }, false],
  ] as const)('reads the hole at rest within %o: %s', (room, isIn) => {
    expect(isHoleInRoom(REST_FRAME, room, { dims, framing: 'approach' })).toBe(
      isIn,
    );
  });
});
