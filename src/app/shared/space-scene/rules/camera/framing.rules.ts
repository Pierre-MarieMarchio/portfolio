import {
  approachFrame,
  ASIDE_FRAME,
  orbitAngle,
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
  Box,
  freeSkyOf,
  outermostReach,
  wholeInFreeSky,
} from './free-sky.rules';
import type { FocusAim, HoleFocus } from '../hole-focus.rules';

export interface HoleFocusRules {
  readonly holeInFocus: (frame: Frame, focus: HoleFocus) => Frame;
  readonly skyRooms: (layout: SceneLayout | null) => Box[];
}

export interface FramingScene {
  rest: Frame;
  dims: Dims | null;
  layout: SceneLayout | null;
  orbits: readonly Orbit[];
  phase: number;
  azim: number;
  sky: { layout: SceneLayout | null; rooms: readonly Box[] };
  reach: number | null;
  holeFocus: HoleFocusRules | null;
  readonly orbitTurn: (i: number) => number;
  readonly nameOf: (i: number) => FocusAim['name'];
}

export const framingScene = (
  rest: Frame,
  orbitTurn: (i: number) => number,
  nameOf: (i: number) => FocusAim['name'],
): FramingScene => ({
  rest,
  dims: null,
  layout: null,
  orbits: [],
  phase: 0,
  azim: 0,
  sky: { layout: null, rooms: [] },
  reach: null,
  holeFocus: null,
  orbitTurn,
  nameOf,
});

export const framingFor = (state: SceneState, scene: FramingScene): Frame => {
  const frame = viewFraming(state, scene);
  const dims = scene.dims;
  const rules = scene.holeFocus;
  return state.phone && dims && rules
    ? rules.holeInFocus(frame, {
        dims,
        rooms: skyRoomsOf(scene, rules),
        isCloseUp: state.framing === 'close-up',
        aim: aimOf(state, scene),
      })
    : frame;
};

const skyRoomsOf = (
  scene: FramingScene,
  rules: HoleFocusRules,
): readonly Box[] => {
  if (scene.sky.layout !== scene.layout) {
    scene.sky = { layout: scene.layout, rooms: rules.skyRooms(scene.layout) };
  }
  return scene.sky.rooms;
};

const aimedRank = (state: SceneState): number => {
  switch (state.framing) {
    case 'overview': {
      return state.ringed;
    }
    case 'rest': {
      return state.emphasised;
    }
    default: {
      return state.framed;
    }
  }
};

const aimOf = (state: SceneState, scene: FramingScene): FocusAim | null => {
  const rank = aimedRank(state);
  const orbit = scene.orbits[rank];
  return orbit && state.framing !== 'aside'
    ? {
        angle: orbitAngle(orbit, scene.phase),
        name: scene.nameOf(rank),
        offset: (az, tilt) => offsetSeen(scene, rank, az, tilt),
      }
    : null;
};

const viewFraming = (state: SceneState, scene: FramingScene): Frame => {
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
      return closeUpBeside(state, scene);
    }
    case 'rest': {
      return scene.rest;
    }
  }
};

const wholeObjectFraming = (frame: Frame, scene: FramingScene): Frame => {
  const dims = scene.dims;
  const outermost = outermostReach(scene.orbits);
  const reach = outermost > 0 ? (scene.reach ?? outermost) : 0;
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
