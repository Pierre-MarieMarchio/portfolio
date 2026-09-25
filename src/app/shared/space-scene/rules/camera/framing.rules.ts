import {
  approachFrame,
  ASIDE_FRAME,
  closeUpFrame,
  Dims,
  Frame,
  OVERVIEW_FRAME,
  SkyBand,
} from './camera-frames.rules';
import type { SceneLayout } from '../../models/scene-layout.model';
import { FALLBACK_VIEWPORT } from '../../models/scene-constants.model';
import type { SceneState } from '../scene-state.rules';
import { Orbit, positionOrbit } from '../scene-bodies.rules';
import { flattening, rollFlatten } from './projection.rules';
import {
  closeUpInRoom,
  freeSkyOf,
  holeRoomBeside,
  outermostReach,
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
  return approachFrame({
    step: state.step,
    rest: scene.rest,
    viewportWidth: scene.layout?.viewport.width ?? FALLBACK_VIEWPORT.width,
    dims: scene.dims,
    orbit: scene.orbits[framed] ?? null,
    panelLeft: scene.layout?.approachEdge ?? null,
    band: skyBand(scene.layout, scene.layout?.approachBandTop),
    isDiscHeld: typeof scene.layout?.sidePanelLeft === 'number',
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(framed),
    offset: (az, tilt) => offsetSeen(scene, framed, az, tilt),
  });
};

const closeUpFraming = (state: SceneState, scene: FramingScene): Frame => {
  const frame = closeUpBeside(state, scene);
  const corner = scene.layout?.cornerPanelLeft;
  const room =
    typeof corner === 'number' ? holeRoomBeside(scene.layout, corner) : null;
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
