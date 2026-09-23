import {
  EngineOptions,
  SpaceSceneEngine,
} from '@shared/space-scene/engine/space-scene.engine';
import {
  RESTING_DIRECTION,
  SceneBody,
  SceneDirection,
  SceneInputs,
} from '@shared/space-scene/models/scene.model';
import { SceneLayout } from '@shared/space-scene/models/scene-layout.model';
import { drivenHost } from '../doubles/driven-host.double';
import { recordingContext } from '../doubles/recording-canvas.double';
import { seededRandom } from '../doubles/seeded-random.double';

const BRIGHT_BODIES = 4;

export const bodyId = (rank: number): string => `body-${String(rank)}`;

export const sceneBodies = (count: number): SceneBody[] =>
  Array.from({ length: count }, (_, rank) => ({
    id: bodyId(rank),
    label: `Body ${String(rank + 1)}`,
    faint: rank >= BRIGHT_BODIES,
  }));

export const SCENE_INPUTS: SceneInputs = {
  bodies: sceneBodies(7),
  direction: { ...RESTING_DIRECTION, presence: 'shown' },
  figureNames: ['Profil', 'Compétences', 'Méthode', 'Parcours'],
  paused: false,
  reduced: false,
};

export type SceneChange = Partial<Omit<SceneInputs, 'direction'>> & {
  readonly direction?: Partial<SceneDirection>;
};

export const WIDE_LAYOUT: SceneLayout = {
  canvas: { left: 0, top: 0 },
  viewport: { width: 1280, height: 800 },
  panels: [
    { left: 780, top: 70, right: 1240, bottom: 640, opacity: 1 },
    { left: 40, top: 640, right: 1240, bottom: 720, opacity: 1 },
  ],
  topBarHeight: 44,
  bottomBarHeight: 90,
  approachEdge: 780,
  closeUpEdge: 880,
};

export interface SceneSetup {
  readonly inputs: SceneInputs;
  readonly layout: SceneLayout;
  readonly dpr: number;
  readonly figures: EngineOptions['figures'];
  readonly withSky: boolean;
  readonly labelSize: {
    readonly width: number;
    readonly height: number;
  } | null;
}

const DEFAULT_SETUP: SceneSetup = {
  inputs: SCENE_INPUTS,
  layout: WIDE_LAYOUT,
  dpr: 1,
  figures: 'constellations',
  withSky: true,
  labelSize: null,
};

const RULE_LINES = 4;

const elements = (count: number): HTMLElement[] =>
  Array.from({ length: count }, () => document.createElement('span'));

const sized = (
  label: HTMLElement,
  size: NonNullable<SceneSetup['labelSize']>,
): void => {
  Object.defineProperty(label, 'offsetWidth', { value: size.width });
  Object.defineProperty(label, 'offsetHeight', { value: size.height });
};

const decimalsRounded = (text: string): string =>
  text.replaceAll(/(?:-|(?<![\d-]))\d+\.\d+/g, (n) => Number(n).toFixed(3));

export const mountEngineScene = (overrides: Partial<SceneSetup> = {}) => {
  const setup = { ...DEFAULT_SETUP, ...overrides };
  const { width, height } = setup.layout.viewport;
  const log: string[] = [];
  const { host, step, isScheduled } = drivenHost();
  const engine = new SpaceSceneEngine(
    host,
    {
      matter: recordingContext('matter', log),
      sky: setup.withSky ? recordingContext('sky', log) : null,
    },
    {
      rnd: seededRandom(7),
      density: 600,
      figures: setup.figures,
      ink: '#e8ecf2',
      accent: '#7cc4f0',
    },
    width * height,
  );
  const buttons = elements(setup.inputs.bodies.length);
  const labels = elements(setup.inputs.bodies.length);
  const lines = elements(RULE_LINES);
  const labelSize = setup.labelSize;
  if (labelSize) {
    for (const label of labels) {
      sized(label, labelSize);
    }
  }
  engine.setNodes(buttons, labels);
  engine.setLines(lines);
  if (labelSize) {
    engine.measureLabels();
  }
  engine.setInputs(setup.inputs);
  engine.setLayout(setup.layout);
  engine.resize(width * setup.dpr, height * setup.dpr, setup.dpr);
  engine.setVisible(true);

  const nodes = [...buttons, ...labels, ...lines];
  const run = (ms: number): string[] => {
    log.length = 0;
    step(ms);
    return [...log];
  };
  const styles = (): string[] =>
    nodes.map((node) => decimalsRounded(node.style.cssText));
  const attributes = (): string[] =>
    nodes.map((node) => `${node.getAttribute('aria-hidden')}|${node.tabIndex}`);
  const set = ({ direction, ...inputs }: SceneChange): void => {
    engine.setInputs({
      ...setup.inputs,
      ...inputs,
      direction: { ...setup.inputs.direction, ...direction },
    });
  };
  return {
    engine,
    run,
    styles,
    attributes,
    set,
    scheduled: isScheduled,
  };
};
