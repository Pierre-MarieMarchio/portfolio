import { EngineInputs, ObjectEngine } from './object-engine';

/**
 * The engine's drawing, pinned before it is refactored (step 9 of the audit
 * plan, D2): on a fixed clock and a fixed seed, every call the engine makes
 * on its two canvases, and every style it writes on the planets, the labels
 * and the rule's lines, is recorded and folded into one fingerprint per
 * scene. A refactor that changes a single stroke changes a fingerprint.
 *
 * Numbers are rounded to 1e-3 device pixel before they are folded: a
 * refactor may reorder an addition, which moves the last bits of a float,
 * never a pixel.
 */

/** A seeded generator, so the scene is the same at every run. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const round = (value: unknown): string =>
  typeof value === 'number'
    ? Number.isFinite(value)
      ? value.toFixed(3)
      : String(value)
    : String(value);

/** FNV-1a, 32 bits: enough to tell two drawings apart. */
const fingerprint = (log: readonly string[]): string => {
  let hash = 0x811c9dc5;
  for (const line of log) {
    for (let i = 0; i < line.length; i++) {
      hash ^= line.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hash ^= 10;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

/**
 * A 2D context that draws nothing and remembers everything: each method
 * call and each property set, in order. Gradients record their stops.
 */
const recordingContext = (
  name: string,
  log: string[],
): CanvasRenderingContext2D => {
  const gradient = (kind: string, args: readonly unknown[]) => ({
    addColorStop: (offset: number, color: string) => {
      log.push(
        `${name}.${kind}(${args.map(round).join(',')}).stop(${round(offset)},${color})`,
      );
    },
  });
  const target: Record<string, unknown> = {
    createRadialGradient: (...args: unknown[]) => gradient('radial', args),
    createLinearGradient: (...args: unknown[]) => gradient('linear', args),
    measureText: (text: string) => ({ width: text.length * 7 }),
  };
  return new Proxy(target, {
    get: (object, property: string) =>
      property in object
        ? object[property]
        : (...args: unknown[]) => {
            log.push(`${name}.${property}(${args.map(round).join(',')})`);
          },
    set: (_object, property: string, value: unknown) => {
      log.push(`${name}.${property}=${round(value)}`);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
};

const INPUTS: EngineInputs = {
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

/** The planets, labels and lines the engine writes its styles on. */
const nodes = (count: number) => {
  const make = (): HTMLElement => document.createElement('span');
  const buttons = Array.from({ length: count }, make);
  const labels = Array.from({ length: count }, make);
  const lines = Array.from({ length: 4 }, make);
  const styles = (): string[] =>
    [...buttons, ...labels, ...lines].map((element) =>
      element.style.cssText.replace(/-?\d+\.\d+/g, (n) => Number(n).toFixed(3)),
    );
  return { buttons, labels, lines, styles };
};

const mount = () => {
  const log: string[] = [];
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const engine = new ObjectEngine(
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
    recordingContext('matter', log),
    recordingContext('sky', log),
    {
      rnd: seeded(7),
      density: 600,
      aboutBodies: 'constellations',
      ink: '#e8ecf2',
      accent: '#7cc4f0',
    },
    1280 * 800,
  );
  const dom = nodes(INPUTS.count);
  engine.setNodes(dom.buttons, dom.labels);
  engine.setLines(dom.lines);
  engine.setInputs(INPUTS);
  engine.setLayout({
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
  });
  engine.resize(1280, 800, 1);
  engine.setVisible(true);
  /** Runs frames at 60 fps for `ms`, then folds what they drew. */
  const scene = (ms: number): string => {
    log.length = 0;
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 1000 / 60);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
    return fingerprint([...log, ...dom.styles()]);
  };
  return { engine, scene, clock: () => clock };
};

describe('ObjectEngine, drawn frame for frame', () => {
  it('draws every scene exactly as it did before the refactor', () => {
    const { engine, scene } = mount();
    const at = (inputs: Partial<EngineInputs>): void => {
      engine.setInputs({ ...INPUTS, ...inputs });
    };
    const drawn: Record<string, string> = {};

    drawn['crossing'] = scene(3000);
    drawn['arrival'] = scene(9000);
    at({ hovered: 1 });
    drawn['home, hovered'] = scene(1500);
    at({ preview: 2 });
    drawn['home, preview'] = scene(2000);
    at({ view: 'index', selected: 3 });
    drawn['index'] = scene(3000);
    at({ view: 'sheet', focus: 2, chapter: 1 });
    drawn['sheet'] = scene(3000);
    at({ view: 'about', part: 2 });
    drawn['about'] = scene(3000);
    at({ view: 'not-found' });
    drawn['not found'] = scene(2000);
    at({ view: 'home' });
    engine.setPointer(640, 400);
    drawn['home, pointer'] = scene(1500);
    engine.setPointer(null);
    // By hand: grabbed in the void above the disk, pushed, let go.
    expect(engine.grab(300, 200)).toBe(true);
    for (let k = 1; k <= 20; k++) {
      engine.turn(300 + k * 12, 200 + k * 4);
      scene(1000 / 60);
    }
    engine.release();
    drawn['turned by hand'] = scene(2500);
    at({ reduced: true });
    drawn['reduced motion'] = scene(1500);

    expect(drawn).toEqual(GOLDEN);
    // A few thousand frames drawn in full: longer than a unit spec's default.
  }, 60_000);
});

/** Taken on the engine at `feat/i18n`, before any of step 9. */
const GOLDEN: Record<string, string> = {
  crossing: '0561053f',
  arrival: '7d6b7a10',
  'home, hovered': 'e98e2e8e',
  'home, preview': '4cf6cc87',
  index: 'd94c01c2',
  sheet: '63517c75',
  about: '0b74a1ca',
  'not found': '06f1ed31',
  'home, pointer': '83e4817d',
  'turned by hand': '5defcccf',
  'reduced motion': 'c73d7c01',
};
