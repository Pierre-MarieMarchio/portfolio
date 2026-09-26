import {
  approachFrame,
  ASIDE_FRAME,
  closeUpFrame,
  Dims,
  Frame,
  OVERVIEW_FRAME,
  referenceRadius,
  SkyBand,
} from './camera-frames.rules';
import type { SceneLayout } from '../../models/scene-layout.model';
import { FALLBACK_VIEWPORT } from '../../models/scene-constants.model';
import type { SceneState } from '../scene-state.rules';
import { Orbit, positionOrbit } from '../scene-bodies.rules';
import { flattening, rollFlatten } from './projection.rules';
import {
  areaOf,
  Box,
  CHROME_CLEARANCE,
  chromeRooms,
  closeUpInRoom,
  freeSkyOf,
  holeRoomBeside,
  isClearOfChrome,
  outermostReach,
  viewportOf,
  wholeInFreeSky,
} from './free-sky.rules';

export interface FramingScene {
  rest: Frame;
  dims: Dims | null;
  layout: SceneLayout | null;
  orbits: readonly Orbit[];
  phase: number;
  azim: number;
  readonly orbitTurn: (i: number) => number;
}

export const framingScene = (
  rest: Frame,
  orbitTurn: (i: number) => number,
): FramingScene => ({
  rest,
  dims: null,
  layout: null,
  orbits: [],
  phase: 0,
  azim: 0,
  orbitTurn,
});

export const framingFor = (state: SceneState, scene: FramingScene): Frame => {
  switch (state.framing) {
    case 'aside': {
      return wholeObjectFraming(ASIDE_FRAME, scene);
    }
    case 'overview': {
      return wholeObjectFraming(OVERVIEW_FRAME, scene);
    }
    case 'approach': {
      return approachFraming(state, scene);
    }
    case 'close-up': {
      return closeUpFraming(state, scene);
    }
    case 'rest': {
      return scene.rest;
    }
  }
};

const wholeObjectFraming = (frame: Frame, scene: FramingScene): Frame => {
  const dims = scene.dims;
  const reach = outermostReach(scene.orbits);
  const sky = dims ? freeSkyOf(scene.layout, dims.w / dims.dpr) : null;
  return dims && sky && reach > 0
    ? wholeInFreeSky(frame, { dims, sky, reach })
    : frame;
};

const approachFraming = (state: SceneState, scene: FramingScene): Frame => {
  const framed = Math.max(0, state.framed);
  const { band, isFolded } = approachBandOf(scene.layout);
  return approachFrame({
    step: state.step,
    rest: scene.rest,
    viewportWidth: scene.layout?.viewport.width ?? FALLBACK_VIEWPORT.width,
    dims: scene.dims,
    orbit: scene.orbits[framed] ?? null,
    panelLeft: scene.layout?.approachEdge ?? null,
    band,
    isPairCentred: isFolded,
    isDiscHeld: typeof scene.layout?.sidePanelLeft === 'number',
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(framed),
    offset: (az, tilt) => offsetSeen(scene, framed, az, tilt),
  });
};

const approachBandOf = (
  layout: SceneLayout | null,
): { readonly band: SkyBand | null; readonly isFolded: boolean } => {
  const bandTop = layout?.approachBandTop;
  const cornerTop = layout?.cornerBandTop;
  const isFolded = typeof bandTop !== 'number' && typeof cornerTop === 'number';
  return { band: skyBand(layout, isFolded ? cornerTop : bandTop), isFolded };
};

const closeUpFraming = (state: SceneState, scene: FramingScene): Frame => {
  const frame = closeUpBeside(state, scene);
  const corner = scene.layout?.cornerPanelLeft;
  const bandTop = scene.layout?.closeUpBandTop;
  if (typeof corner !== 'number') {
    return typeof bandTop === 'number'
      ? (closeUpClearOfChrome(scene.layout, frame, {
          bandTop,
          offset: offsetSeen(scene, state.framed, frame.az, scene.rest),
        }) ?? frame)
      : frame;
  }
  const room = holeRoomBeside(scene.layout, corner);
  return room && scene.dims
    ? closeUpInRoom(frame, { dims: scene.dims, room })
    : frame;
};

const closeUpBeside = (state: SceneState, scene: FramingScene): Frame => {
  const framed = state.framed;
  return closeUpFrame({
    rest: scene.rest,
    dims: scene.dims,
    orbit: scene.orbits[framed] ?? null,
    panelLeft: scene.layout?.closeUpEdge ?? null,
    band: skyBand(scene.layout, scene.layout?.closeUpBandTop),
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(framed),
    offset: (az, tilt) => offsetSeen(scene, framed, az, tilt),
  });
};

const skyBand = (
  layout: SceneLayout | null,
  bandTop: number | null | undefined,
): SkyBand | null =>
  layout && typeof bandTop === 'number'
    ? {
        top: (layout.topBarHeight ?? 0) - layout.canvas.top,
        bottom: bandTop - layout.canvas.top,
      }
    : null;

const offsetSeen = (
  scene: FramingScene,
  i: number,
  az: number,
  tilt: Pick<Frame, 'ev' | 'i'>,
): { nx: number; ny: number } => {
  const orbit = scene.orbits[i];
  if (!orbit) {
    return { nx: 0, ny: 0 };
  }
  const elev = tilt.ev;
  const p = positionOrbit(
    orbit,
    { phase: scene.phase, elev, azim: az },
    { x: 0, y: 0, z: 0 },
  );
  return rollFlatten(
    p,
    {
      flatten: flattening(elev),
      cr: Math.cos(tilt.i),
      sr: Math.sin(tilt.i),
    },
    { nx: 0, ny: 0 },
  );
};

const PAIR = { planetReach: 24, shares: [1, 0.9, 0.8, 0.7, 0.6, 0.5] } as const;

const pairBoxOf = (
  radius: number,
  offset: { readonly nx: number; readonly ny: number },
): Box => {
  const reach = radius + CHROME_CLEARANCE;
  const px = offset.nx * radius;
  const py = offset.ny * radius;
  return {
    left: Math.min(-reach, px - PAIR.planetReach),
    right: Math.max(reach, px + PAIR.planetReach),
    top: Math.min(-reach, py - PAIR.planetReach),
    bottom: Math.max(reach, py + PAIR.planetReach),
  };
};

const roomHolding = (rooms: readonly Box[], pair: Box): Box | null => {
  let best: Box | null = null;
  for (const room of rooms) {
    const isHolding =
      room.right - room.left >= pair.right - pair.left &&
      room.bottom - room.top >= pair.bottom - pair.top;
    if (isHolding && (!best || areaOf(room) > areaOf(best))) {
      best = room;
    }
  }
  return best;
};

export const closeUpClearOfChrome = (
  layout: SceneLayout | null,
  frame: Frame,
  {
    bandTop,
    offset,
  }: {
    readonly bandTop: number;
    readonly offset: { readonly nx: number; readonly ny: number };
  },
): Frame | null => {
  if (isClearOfChrome(layout, frame)) {
    return null;
  }
  const { width, height } = viewportOf(layout);
  const rooms = chromeRooms(layout, {
    left: 0,
    top: bandTop - (layout?.canvas.top ?? 0),
    right: width,
    bottom: height,
  });
  for (const share of PAIR.shares) {
    const s = frame.s * share;
    const pair = pairBoxOf(referenceRadius(width, height, s), offset);
    const room = roomHolding(rooms, pair);
    if (room) {
      return {
        ...frame,
        s,
        x: (room.left + room.right - pair.left - pair.right) / 2 / width,
        y: (room.top + room.bottom - pair.top - pair.bottom) / 2 / height,
      };
    }
  }
  return null;
};
