import { clamp, nearestTurn } from '@app/core/helpers';
import type { LayoutBox, SceneLayout } from '../../models/scene-layout.model';
import {
  Dims,
  Frame,
  orbitAngle,
  referenceRadius,
} from '../camera/camera-frames.rules';
import type { FreeSky } from '../camera/free-sky.rules';
import type { Orbit } from '../scene-bodies.rules';
import type { SceneState } from '../scene-state.rules';

export interface WindowRoom {
  readonly left: number;
  readonly right: number;
}

export type RoomSide = 'left' | 'right' | 'middle';

export interface PlanetTurn {
  readonly angle: number;
  readonly azim: number;
}

const ROOM = { widthShare: 0.15, gap: 16, tolerance: 1 } as const;

const spanOf = (box: LayoutBox, width: number): WindowRoom => ({
  left: clamp(box.left, 0, width),
  right: clamp(box.right, 0, width),
});

const widestGap = (
  windows: readonly LayoutBox[],
  width: number,
): WindowRoom => {
  const spans = windows
    .map((box) => spanOf(box, width))
    .sort((a, b) => a.left - b.left);
  let best: WindowRoom = { left: 0, right: 0 };
  let from = 0;
  for (const span of [...spans, { left: width, right: width }]) {
    if (span.left - from > best.right - best.left) {
      best = { left: from, right: span.left };
    }
    from = Math.max(from, span.right);
  }
  return best;
};

export interface RoomMemo {
  readonly layout: SceneLayout | null;
  readonly room: WindowRoom | null;
}

export const NO_ROOM: RoomMemo = { layout: null, room: null };

export const roomAfter = (
  memo: RoomMemo,
  layout: SceneLayout | null,
): RoomMemo =>
  !layout || memo.layout === layout
    ? memo
    : { layout, room: windowRoomOf(layout, memo.room) };

export const windowRoomOf = (
  layout: SceneLayout,
  last: WindowRoom | null,
): WindowRoom | null => {
  const windows = layout.windows;
  if (windows.length === 0) {
    return null;
  }
  const width = layout.viewport.width;
  const room = widestGap(windows, width);
  return room.right - room.left >= width * ROOM.widthShare ? room : last;
};

export const sideOf = (room: WindowRoom, width: number): RoomSide => {
  if (room.left <= 0) {
    return 'left';
  }
  return room.right >= width ? 'right' : 'middle';
};

const BANDS = [
  'approachBandTop',
  'closeUpBandTop',
  'panelBandTop',
  'cornerBandTop',
] as const;

export const hasBand = (layout: SceneLayout): boolean =>
  BANDS.some((band) => typeof layout[band] === 'number');

export const layoutInRoom = (
  layout: SceneLayout,
  room: WindowRoom,
): SceneLayout => {
  const { width, height } = layout.viewport;
  const side = sideOf(room, width);
  if (side === 'left') {
    return {
      ...layout,
      approachEdge: Math.round(room.right),
      closeUpEdge: room.right,
    };
  }
  const edge = width - room.left;
  return {
    ...layout,
    approachEdge: edge,
    closeUpEdge: edge,
    sidePanelLeft: height > width ? edge : null,
    cornerPanelLeft: null,
  };
};

export const skyOfRoom = (layout: SceneLayout, room: WindowRoom): FreeSky => ({
  left: room.left - layout.canvas.left + ROOM.gap,
  right: room.right - layout.canvas.left - ROOM.gap,
  top: (layout.topBarHeight ?? 0) - layout.canvas.top,
  bottom: layout.viewport.height - layout.canvas.top,
});

const CLOSE_UP_DRAWN = 0.94;

export interface HoleView {
  readonly dims: Dims;
  readonly framing: SceneState['framing'];
}

const drawnRadius = (frame: Frame, { dims, framing }: HoleView): number =>
  referenceRadius(dims.w, dims.h, frame.s) *
  (framing === 'close-up' ? CLOSE_UP_DRAWN : 1);

export const holeKeptLeftOf = (
  frame: Frame,
  layout: SceneLayout,
  view: HoleView,
): Frame => {
  const edge = view.framing === 'close-up' ? layout.closeUpEdge : null;
  const beside = view.framing === 'approach' ? layout.approachEdge : edge;
  if (beside === null) {
    return frame;
  }
  const { w, dpr } = view.dims;
  const radius = drawnRadius(frame, view);
  const over = frame.x * w + radius - beside * dpr;
  return over > 0
    ? { ...frame, x: Math.max(radius / w, frame.x - over / w) }
    : frame;
};

export const isHoleInRoom = (
  frame: Frame,
  room: WindowRoom,
  view: HoleView,
): boolean => {
  const { w, dpr } = view.dims;
  const radius = drawnRadius(frame, view) / dpr;
  const cx = (frame.x * w) / dpr;
  return (
    cx - radius >= room.left - ROOM.tolerance &&
    cx + radius <= room.right + ROOM.tolerance
  );
};

export const mirroredFrame = (frame: Frame, turn: PlanetTurn | null): Frame => {
  const az = turn
    ? nearestTurn(Math.PI - 2 * turn.angle - frame.az, turn.azim)
    : frame.az;
  return { ...frame, x: 1 - frame.x, i: -frame.i, az };
};

export interface MirrorTurn {
  readonly i: number;
  readonly az: number;
}

const MIRROR_TURN_RATE = 0.6;

const turnToward = (current: number, target: number, max: number): number => {
  const delta = target - current;
  return Math.abs(delta) <= max ? target : current + Math.sign(delta) * max;
};

export const mirrorTurnStep = (
  current: MirrorTurn | null,
  target: MirrorTurn,
  dt: number,
): MirrorTurn => {
  if (!current) {
    return target;
  }
  const max = MIRROR_TURN_RATE * Math.max(dt, 0);
  return {
    i: turnToward(current.i, target.i, max),
    az: turnToward(current.az, target.az, max),
  };
};

interface TurnedOrbits {
  readonly orbits: readonly Orbit[];
  readonly phase: number;
  readonly azim: number;
  readonly orbitTurn: (i: number) => number;
}

export const planetTurnOf = (
  state: Pick<SceneState, 'framing' | 'framed'>,
  scene: TurnedOrbits,
): PlanetTurn | null => {
  const isFramed = state.framing === 'approach' || state.framing === 'close-up';
  const framed =
    state.framing === 'approach' ? Math.max(0, state.framed) : state.framed;
  const orbit = scene.orbits[framed];
  return isFramed && orbit
    ? {
        angle: orbitAngle(orbit, scene.phase),
        azim: scene.azim + scene.orbitTurn(framed),
      }
    : null;
};
