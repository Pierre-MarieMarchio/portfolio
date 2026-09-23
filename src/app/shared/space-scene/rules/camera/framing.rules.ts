import {
  approachFrame,
  ASIDE_FRAME,
  closeUpFrame,
  Dims,
  Frame,
  OVERVIEW_FRAME,
} from './camera-frames.rules';
import type { SceneLayout } from '../../models/scene-layout.model';
import type { SceneState } from '../scene-state.rules';
import { Orbit, positionOrbit } from '../scene-bodies.rules';
import { flattening, rollFlatten } from './projection.rules';

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
      return ASIDE_FRAME;
    }
    case 'overview': {
      return OVERVIEW_FRAME;
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

const approachFraming = (state: SceneState, scene: FramingScene): Frame => {
  const framed = Math.max(0, state.framed);
  return approachFrame({
    step: state.step,
    rest: scene.rest,
    viewportWidth: scene.layout?.viewport.width ?? 1200,
    dims: scene.dims,
    orbit: scene.orbits[framed] ?? null,
    panelLeft: scene.layout?.approachEdge ?? null,
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(framed),
  });
};

const closeUpFraming = (state: SceneState, scene: FramingScene): Frame => {
  const framed = state.framed;
  return closeUpFrame({
    rest: scene.rest,
    dims: scene.dims,
    orbit: scene.orbits[framed] ?? null,
    panelLeft: scene.layout?.closeUpEdge ?? null,
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(framed),
    offset: (az) => offsetAtRest(scene, framed, az),
  });
};

const offsetAtRest = (
  scene: FramingScene,
  i: number,
  az: number,
): { nx: number; ny: number } => {
  const orbit = scene.orbits[i];
  if (!orbit) {
    return { nx: 0, ny: 0 };
  }
  const rest = scene.rest;
  const elev = rest.ev;
  const p = positionOrbit(
    orbit,
    { phase: scene.phase, elev, azim: az },
    { x: 0, y: 0, z: 0 },
  );
  return rollFlatten(
    p,
    {
      flatten: flattening(elev),
      cr: Math.cos(rest.i),
      sr: Math.sin(rest.i),
    },
    { nx: 0, ny: 0 },
  );
};
