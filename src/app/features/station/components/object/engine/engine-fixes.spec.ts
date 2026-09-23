import { Frame, HOME_FRAME, measureHome, referenceRadius } from './camera';
import { EngineInputs, ObjectEngine } from './object-engine';
import { fitOrbits, placeOrbits } from './scene';
import { TRAVELING_END } from './traveling';

/*
 * The fixes of report 01 (docs/audit/rapports/01-moteur-bugs.md) the
 * refactor of step 9 brought: each one is held here.
 */

/** A seeded generator: a constant one never lets the scene find a place. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/** The home framing the engine measures for a viewport, as it lays out. */
const homeOf = (w: number, h: number): { frame: Frame; freeHalf: number } => {
  const measure = measureHome({ width: w, height: h }, 44, 90);
  return {
    frame: { ...HOME_FRAME, ...measure },
    freeHalf: measure.freeHalf,
  };
};

describe('fitOrbits', () => {
  const fitted = (w: number, h: number): number[] => {
    const { frame, freeHalf } = homeOf(w, h);
    const orbits = placeOrbits(7);
    fitOrbits(orbits, { w, h, dpr: 1 }, frame, freeHalf);
    return orbits.map((orbit) => orbit.rb);
  };
  /** The room the outer orbit has across, in object radii. */
  const room = (w: number, h: number): number => {
    const { frame } = homeOf(w, h);
    const cx = w * frame.x;
    return (Math.min(cx, w - cx) - 74) / referenceRadius(w, h, frame.s);
  };

  it('keeps the orbits well out of the disk where there is room', () => {
    const outer = Math.max(...fitted(1280, 800));

    expect(outer).toBeGreaterThanOrEqual(4.6);
    expect(outer).toBeLessThanOrEqual(6.9);
  });

  /** The floor of 4.6 used to put the outer orbit off a phone's screen. */
  it('keeps the outer orbit in the frame on a phone', () => {
    // The case the old floor got wrong: less room than 4.6 radii.
    expect(room(375, 667)).toBeLessThan(4.6);
    expect(Math.max(...fitted(375, 667))).toBeLessThanOrEqual(
      room(375, 667) + 1e-9,
    );
  });

  it('keeps the inner orbit inside the outer one, whatever the room', () => {
    for (const [w, h] of [
      [1280, 800],
      [924, 540],
      [375, 667],
      [320, 480],
    ] as const) {
      const radii = fitted(w, h);
      expect(Math.min(...radii)).toBeLessThan(Math.max(...radii));
    }
  });
});

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
  partLabels: ['A', 'B', 'C', 'D'],
};

/** A context that records what it is asked to write, and nothing else. */
const writer = (texts: string[]): CanvasRenderingContext2D =>
  new Proxy(
    {},
    {
      get: (_object, property: string) =>
        property === 'fillText'
          ? (text: string) => {
              texts.push(text);
            }
          : property.startsWith('create')
            ? () => ({ addColorStop: () => undefined })
            : () => undefined,
      set: () => true,
    },
  ) as CanvasRenderingContext2D;

const mount = (
  inputs: Partial<EngineInputs> = {},
  aboutBodies: 'constellations' | 'comets' = 'constellations',
) => {
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const texts: string[] = [];
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
    writer(texts),
    writer(texts),
    {
      rnd: seeded(3),
      density: 100,
      aboutBodies,
      ink: '#fff',
      accent: '#0af',
    },
    1280 * 800,
  );
  engine.setInputs({ ...INPUTS, ...inputs });
  engine.setLayout({
    canvas: { left: 0, top: 0 },
    viewport: { width: 1280, height: 800 },
    panels: [],
    headHeight: 44,
    ruleHeight: 90,
    sheetLeft: null,
    previewLeft: null,
  });
  engine.resize(1280, 800, 1);
  const step = (ms: number): void => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 1000 / 60);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
  };
  return { engine, step, texts };
};

describe('ObjectEngine, fixed', () => {
  /** Its clock stood still at 0 meanwhile, and the crossing started over. */
  it('does not replay the crossing when motion is switched back on', () => {
    const { engine, step } = mount({ reduced: true });
    step(1000);

    engine.setInputs({ ...INPUTS, reduced: false });
    step(100);

    const time = (engine as unknown as { time: number }).time;
    expect(time).toBeGreaterThanOrEqual(TRAVELING_END);
  });

  it('plays the crossing when the page opens with motion', () => {
    const { engine, step } = mount();
    step(1000);

    const time = (engine as unknown as { time: number }).time;
    expect(time).toBeLessThan(TRAVELING_END);
  });

  /** The camera's aim read last frame's radii, 1.6 at the first. */
  it('fits the orbits before the camera aims at them', () => {
    const { engine, step } = mount();
    step(12_000);
    const view = engine as unknown as {
      orbits: readonly { rb: number }[];
      target: () => unknown;
    };
    const seen: number[] = [];
    const before = view.orbits.at(-1)?.rb;
    const target = view.target.bind(engine);
    view.target = () => {
      seen.push(view.orbits.at(-1)?.rb ?? Number.NaN);
      return target();
    };

    // A taller head leaves less room: the orbits are fitted anew.
    engine.setLayout({
      canvas: { left: 0, top: 0 },
      viewport: { width: 1280, height: 800 },
      panels: [],
      headHeight: 220,
      ruleHeight: 220,
      sheetLeft: null,
      previewLeft: null,
    });
    step(1000 / 60);

    // The aim read radii fitted to the new room, not the last frame's.
    expect(seen[0]).not.toBe(before);
    expect(seen[0]).toBeCloseTo(view.orbits.at(-1)?.rb ?? Number.NaN, 1);
  });

  it('bounds the part by the figures there are, whatever it is asked', () => {
    const { step, texts } = mount({ view: 'about', part: 9 }, 'comets');

    step(4000);

    expect(texts).toContain('D');
    expect(texts).not.toContain('undefined');
  });
});
