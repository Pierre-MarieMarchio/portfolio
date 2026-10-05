import type { EngineOptions } from '../engine/space-scene.engine';
import type { SceneState } from './scene-state.rules';
import { Orbit } from './scene-bodies.rules';
import { ScreenHole } from './camera/projection.rules';
import { ARRIVED, Traveling } from './camera/traveling.rules';
import { noFocus, PlanetFocus } from './planets/planet-focus.rules';
import { veilAt, Zone } from './panel-veil.rules';
import type { SkyRoom } from './figures/figure-room.rules';
import type { HoleFocusRules } from './camera/framing/framing.rules';

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
  hoverPoint: { readonly x: number; readonly y: number } | null;
  pointer: { readonly x: number; readonly y: number } | null;
  hole: ScreenHole;
  unzoomedHole: ScreenHole;
  readonly aim: { x: number; y: number; isShown: boolean };
  arrived: boolean;
  zones: readonly Zone[];
  topBar: Zone | null;
  figureRoom: SkyRoom | null;
  phoneRules: HoleFocusRules | null;
  fade: number;
  orbits: readonly Orbit[];
  readonly focus: PlanetFocus;
  readonly veil: (x: number, y: number) => number;
}

const restingView = () => ({
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
});

type FrameStyle = Pick<EngineOptions, 'ink' | 'accent'>;

const restingFrame = (
  state: SceneState,
  { ink, accent }: FrameStyle,
): Omit<SceneFrame, 'veil'> => ({
  state,
  ink,
  accent,
  ...restingView(),
  marks: 0,
  figures: 0,
  lit: [],
  hoverPoint: null,
  pointer: null,
  hole: { cx: 0, cy: 0, radius: 0 },
  unzoomedHole: { cx: 0, cy: 0, radius: 0 },
  aim: { x: 0, y: 0, isShown: false },
  arrived: true,
  zones: [],
  topBar: null,
  figureRoom: null,
  phoneRules: null,
  fade: 0,
  orbits: [],
  focus: noFocus(),
});

export const sceneFrame = (
  state: SceneState,
  options: FrameStyle,
): SceneFrame => {
  const frame: SceneFrame = {
    ...restingFrame(state, options),
    veil: (x, y) => veilAt(frame.zones, frame.fade, x, y),
  };
  return frame;
};
