import {
  EngineInputs,
  EngineOptions,
  Layout,
  SpaceSceneEngine,
} from '@app/features/desktop/engine/space-scene.engine';
import { recordingContext } from '../doubles/recording-canvas.double';
import { seededRandom } from '../doubles/seeded-random.double';

export const SCENE_INPUTS: EngineInputs = {
  count: 7,
  featured: 4,
  view: 'home',
  focus: -1,
  chapter: 0,
  part: 0,
  preview: -1,
  hovered: -1,
  selected: -1,
  paused: false,
  reduced: false,
  revealed: true,
  partLabels: ['Profil', 'Compétences', 'Méthode', 'Parcours'],
};

export const DESKTOP_LAYOUT: Layout = {
  canvas: { left: 0, top: 0 },
  viewport: { width: 1280, height: 800 },
  panels: [
    { left: 780, top: 70, right: 1240, bottom: 640, opacity: 1 },
    { left: 40, top: 640, right: 1240, bottom: 720, opacity: 1 },
  ],
  headHeight: 44,
  ruleHeight: 90,
  sheetLeft: 780,
  previewLeft: 880,
};

export interface SceneSetup {
  readonly inputs: EngineInputs;
  readonly layout: Layout;
  readonly dpr: number;
  readonly aboutBodies: EngineOptions['aboutBodies'];
  readonly withSky: boolean;
  readonly labelSize: {
    readonly width: number;
    readonly height: number;
  } | null;
}

const DEFAULT_SETUP: SceneSetup = {
  inputs: SCENE_INPUTS,
  layout: DESKTOP_LAYOUT,
  dpr: 1,
  aboutBodies: 'constellations',
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
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const engine = new SpaceSceneEngine(
    {
      frame: (callback) => {
        pending = callback;
        return () => {
          pending = null;
        };
      },
      now: () => clock,
      hidden: () => false,
    },
    {
      matter: recordingContext('matter', log),
      sky: setup.withSky ? recordingContext('sky', log) : null,
    },
    {
      rnd: seededRandom(7),
      density: 600,
      aboutBodies: setup.aboutBodies,
      ink: '#e8ecf2',
      accent: '#7cc4f0',
    },
    width * height,
  );
  const buttons = elements(setup.inputs.count);
  const labels = elements(setup.inputs.count);
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
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 1000 / 60);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
    return [...log];
  };
  const styles = (): string[] =>
    nodes.map((node) => decimalsRounded(node.style.cssText));
  const attributes = (): string[] =>
    nodes.map((node) => `${node.getAttribute('aria-hidden')}|${node.tabIndex}`);
  const set = (inputs: Partial<EngineInputs>): void => {
    engine.setInputs({ ...setup.inputs, ...inputs });
  };
  return {
    engine,
    run,
    styles,
    attributes,
    set,
    scheduled: () => pending !== null,
  };
};
