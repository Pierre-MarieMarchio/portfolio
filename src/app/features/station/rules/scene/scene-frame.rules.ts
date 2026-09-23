import type {
  EngineInputs,
  EngineOptions,
} from '../../components/object/engine/object-engine';
import { Orbit } from '../../components/object/engine/scene';
import { ScreenHole } from '../../components/object/engine/projection';
import { ARRIVED, Traveling } from '../../components/object/engine/traveling';
import { noFocus, PlanetFocus } from './planet-focus.rules';
import { veilAt, Zone } from './panel-veil.rules';

export const NO_INPUTS: EngineInputs = {
  count: 0,
  featured: 0,
  view: 'home',
  focus: -1,
  chapter: 0,
  part: 0,
  partLabels: [],
  preview: -1,
  hovered: -1,
  selected: -1,
  paused: false,
  reduced: false,
  revealed: false,
};

export interface SceneFrame {
  inputs: EngineInputs;
  readonly ink: string;
  readonly accent: string;
  w: number;
  h: number;
  dpr: number;
  time: number;
  phase: number;
  entry: number;
  preview: number;
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
  about: number;
  lit: readonly number[];
  pointer: { readonly x: number; readonly y: number } | null;
  hole: ScreenHole;
  zones: readonly Zone[];
  fade: number;
  orbits: readonly Orbit[];
  readonly focus: PlanetFocus;
  readonly veil: (x: number, y: number) => number;
}

export const sceneFrame = (
  inputs: EngineInputs,
  { ink, accent }: Pick<EngineOptions, 'ink' | 'accent'>,
): SceneFrame => {
  const frame: SceneFrame = {
    inputs,
    ink,
    accent,
    w: 0,
    h: 0,
    dpr: 1,
    time: 0,
    phase: 0,
    entry: 0,
    preview: 0,
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
    about: 0,
    lit: [],
    pointer: null,
    hole: { cx: 0, cy: 0, radius: 0 },
    zones: [],
    fade: 0,
    orbits: [],
    focus: noFocus(),
    veil: (x, y) => veilAt(frame.zones, frame.fade, x, y),
  };
  return frame;
};
