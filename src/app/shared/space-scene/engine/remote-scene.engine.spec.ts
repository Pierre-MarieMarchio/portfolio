import { SpaceSceneEngine } from './space-scene.engine';
import type { SceneEngine } from '../models/scene-engine.model';
import { drivenHost } from '@testing/doubles/driven-host.double';
import { recordingContext } from '@testing/doubles/recording-canvas.double';
import { seededRandom } from '@testing/doubles/seeded-random.double';
import {
  bodyId,
  SCENE_INPUTS,
  WIDE_LAYOUT,
} from '@testing/fixtures/engine-scene.fixture';
import { pairedScene } from '@testing/fixtures/scene-worker.fixture';

const WIDTH = 1280;
const HEIGHT = 800;
const PAST_CROSSING_MS = 12_000;

const elements = (count: number): HTMLElement[] =>
  Array.from({ length: count }, () => document.createElement('span'));

const sceneNodes = () => ({
  buttons: elements(SCENE_INPUTS.bodies.length),
  labels: elements(SCENE_INPUTS.bodies.length),
  lines: elements(4),
  hole: document.createElement('div'),
});

type SceneNodes = ReturnType<typeof sceneNodes>;

const drive = (engine: SceneEngine, nodes: SceneNodes): void => {
  engine.setNodes(nodes.buttons, nodes.labels);
  engine.setLines(nodes.lines);
  engine.setHoleMark(nodes.hole);
  engine.setInputs(SCENE_INPUTS);
  engine.setLayout(WIDE_LAYOUT);
  engine.resize(WIDTH, HEIGHT, 1);
  engine.setVisible(true);
};

const pageScene = () => {
  const log: string[] = [];
  const clock = drivenHost();
  const engine = new SpaceSceneEngine(
    clock.host,
    {
      matter: recordingContext('matter', log),
      sky: recordingContext('sky', log),
    },
    {
      rnd: seededRandom(7),
      density: 600,
      figures: 'constellations',
      ink: '#e8ecf2',
      accent: '#7cc4f0',
    },
    WIDTH * HEIGHT,
  );
  return { engine, log, run: (ms: number) => clock.step(ms) };
};

const written = (nodes: SceneNodes): string[] => [
  ...[...nodes.buttons, ...nodes.labels, ...nodes.lines].map(
    (node) =>
      `${node.style.cssText}|${String(node.getAttribute('aria-hidden'))}|${String(node.tabIndex)}`,
  ),
  nodes.hole.dataset['holeX'] ?? '',
];

const pagedAndPaired = async (ms: number) => {
  const page = pageScene();
  const pageNodes = sceneNodes();
  drive(page.engine, pageNodes);
  page.run(ms);
  const paired = pairedScene();
  const pairedNodes = sceneNodes();
  drive(paired.engine, pairedNodes);
  await paired.run(ms);
  return { page, pageNodes, paired, pairedNodes };
};

describe('RemoteSceneEngine', { timeout: 30_000 }, () => {
  it('draws through the worker exactly what the page draws, stroke for stroke', async () => {
    const { page, paired } = await pagedAndPaired(3000);

    expect(paired.log.length).toBeGreaterThan(1000);
    expect(paired.log).toEqual(page.log);
  });

  it('writes the same place, fade and reach on every label, button and line as the page', async () => {
    const { pageNodes, pairedNodes } = await pagedAndPaired(3000);

    expect(written(pairedNodes)).toEqual(written(pageNodes));
    expect(pairedNodes.hole.dataset['holeX']).toBeDefined();
  });

  it('shows one picture per page frame, the newest of its burst, and lets the older ones go', async () => {
    const paired = pairedScene();
    drive(paired.engine, sceneNodes());
    await paired.run(500);

    const matter = paired.shown.filter((bitmap) => bitmap.name === 'matter');
    const dropped = paired.made.filter(
      (bitmap) => !paired.shown.includes(bitmap),
    );
    const made = paired.made.filter((bitmap) => bitmap.name === 'matter');
    expect(matter).toHaveLength(2);
    expect(matter.at(-1)).toBe(made.at(-1));
    expect(dropped.length).toBeGreaterThan(10);
    expect(dropped.every((bitmap) => bitmap.isClosed)).toBe(true);
    expect(paired.canvases.matter.canvas).toEqual({
      width: WIDTH,
      height: HEIGHT,
    });
  });

  it('answers at once whether a hand on the disk dragged it, as the page does', async () => {
    const paired = pairedScene();
    drive(paired.engine, sceneNodes());
    await paired.run(PAST_CROSSING_MS);
    const { engine } = paired;

    expect(engine.grab(640, 400)).toBe(true);
    engine.turn(643, 402);
    expect(engine.release()).toBe(false);

    expect(engine.grab(640, 400)).toBe(true);
    engine.turn(660, 400);
    expect(engine.release()).toBe(true);
    expect(engine.release()).toBe(false);
  });

  it('refuses the hand under reduced motion, and a closer look away from the rest', () => {
    const paired = pairedScene();
    drive(paired.engine, sceneNodes());
    const { engine } = paired;

    engine.setInputs({ ...SCENE_INPUTS, reduced: true });
    expect(engine.grab(640, 400)).toBe(false);

    engine.setInputs({
      ...SCENE_INPUTS,
      direction: {
        ...SCENE_INPUTS.direction,
        framing: { kind: 'close-up', body: bodyId(2) },
      },
    });
    expect(engine.lookCloser()).toBe(false);
    expect(engine.holdZoom(10, 10)).toBe(true);
  });

  it('passes on when its camera sets off and when it lands', async () => {
    const paired = pairedScene();
    drive(paired.engine, sceneNodes());
    await paired.run(PAST_CROSSING_MS);
    const before = paired.travels.length;

    paired.engine.setInputs({
      ...SCENE_INPUTS,
      direction: {
        ...SCENE_INPUTS.direction,
        framing: { kind: 'close-up', body: bodyId(2) },
      },
    });
    await paired.run(PAST_CROSSING_MS);

    expect(paired.travels.slice(before)).toEqual([true, false]);
  });
});
