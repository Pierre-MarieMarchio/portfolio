import type { EngineOptions } from '../engine/space-scene.engine';
import type { SceneState } from './scene-state.rules';
import { Orbit } from './scene-bodies.rules';
import { ScreenHole } from './camera/projection.rules';
import { ARRIVED, Traveling } from './camera/traveling.rules';
import { noFocus, PlanetFocus } from './planets/planet-focus.rules';
import { veilAt, Zone } from './panel-veil.rules';

export interface SceneFrame {
  state: SceneState;
  readonly ink: string;
  readonly accent: string;
  w: number;
  h: number;
  dpr: number;
  time: number;
  phase: number;
  entry: number;
  closeUp: number;
  trv: Traveling;
  cx: number;
  cy: number;
  radius: number;
  elev: number;
  flatten: number;
  cr: number;
  sr: number;
  azim: number;
  diskAzim: number;
  marks: number;
  figures: number;
  lit: readonly number[];
  pointer: { readonly x: number; readonly y: number } | null;
  hole: ScreenHole;
  arrived: boolean;
  zones: readonly Zone[];
  fade: number;
  orbits: readonly Orbit[];
  readonly focus: PlanetFocus;
  readonly veil: (x: number, y: number) => number;
}

export const sceneFrame = (
  state: SceneState,
  { ink, accent }: Pick<EngineOptions, 'ink' | 'accent'>,
): SceneFrame => {
  const frame: SceneFrame = {
    state,
    ink,
    accent,
    w: 0,
    h: 0,
    dpr: 1,
    time: 0,
    phase: 0,
    entry: 0,
    closeUp: 0,
    trv: ARRIVED,
    cx: 0,
    cy: 0,
    radius: 0,
    elev: 0,
    flatten: 1,
    cr: 1,
    sr: 0,
    azim: 0,
    diskAzim: 0,
    marks: 0,
    figures: 0,
    lit: [],
    pointer: null,
    hole: { cx: 0, cy: 0, radius: 0 },
    arrived: true,
    zones: [],
    fade: 0,
    orbits: [],
    focus: noFocus(),
    veil: (x, y) => veilAt(frame.zones, frame.fade, x, y),
  };
  return frame;
};
