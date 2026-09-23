import {
  ABOUT_FRAME,
  Dims,
  Frame,
  INDEX_FRAME,
  previewFrame,
  sheetFrame,
} from './camera-frames.rules';
import type { EngineInputs, Layout } from '../../../engine/space-scene.engine';
import { Orbit, positionOrbit } from '../scene-bodies.rules';
import { flattening, rollFlatten } from './projection.rules';

export interface FramingScene {
  home: Frame;
  dims: Dims | null;
  layout: Layout | null;
  orbits: readonly Orbit[];
  phase: number;
  azim: number;
  readonly orbitTurn: (i: number) => number;
}

export const framingScene = (
  home: Frame,
  orbitTurn: (i: number) => number,
): FramingScene => ({
  home,
  dims: null,
  layout: null,
  orbits: [],
  phase: 0,
  azim: 0,
  orbitTurn,
});

/** The framing for the current view. */
export const framingFor = (
  inputs: EngineInputs,
  scene: FramingScene,
): Frame => {
  switch (inputs.view) {
    case 'about': {
      return ABOUT_FRAME;
    }
    case 'index':
    case 'not-found': {
      return INDEX_FRAME;
    }
    case 'sheet': {
      return sheetFraming(inputs, scene);
    }
    case 'home': {
      return inputs.preview < 0 ? scene.home : previewFraming(inputs, scene);
    }
  }
};

const sheetFraming = (inputs: EngineInputs, scene: FramingScene): Frame => {
  const focus = Math.max(0, inputs.focus);
  return sheetFrame({
    chapter: inputs.chapter,
    home: scene.home,
    viewportWidth: scene.layout?.viewport.width ?? 1200,
    dims: scene.dims,
    orbit: scene.orbits[focus] ?? null,
    panelLeft: scene.layout?.sheetLeft ?? null,
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(focus),
  });
};

const previewFraming = (inputs: EngineInputs, scene: FramingScene): Frame => {
  const preview = inputs.preview;
  return previewFrame({
    home: scene.home,
    dims: scene.dims,
    orbit: scene.orbits[preview] ?? null,
    cardLeft: scene.layout?.previewLeft ?? null,
    phase: scene.phase,
    azim: scene.azim + scene.orbitTurn(preview),
    offset: (az) => offsetOnHome(scene, preview, az),
  });
};

/**
 * Where planet `i` is, in object radii after roll, on the home framing:
 * what the aim point takes off to know where to put the centre.
 */
const offsetOnHome = (
  scene: FramingScene,
  i: number,
  az: number,
): { nx: number; ny: number } => {
  const orbit = scene.orbits[i];
  if (!orbit) {
    return { nx: 0, ny: 0 };
  }
  const home = scene.home;
  const elev = home.ev;
  const p = positionOrbit(
    orbit,
    { phase: scene.phase, elev, azim: az },
    { x: 0, y: 0, z: 0 },
  );
  return rollFlatten(
    p,
    {
      flatten: flattening(elev),
      cr: Math.cos(home.i),
      sr: Math.sin(home.i),
    },
    { nx: 0, ny: 0 },
  );
};
