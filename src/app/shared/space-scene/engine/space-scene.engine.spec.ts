import { EngineHost, SpaceSceneEngine } from './space-scene.engine';
import {
  RESTING_DIRECTION,
  SceneDirection,
  SceneInputs,
} from '../models/scene.model';
import { SceneLayout } from '../models/scene-layout.model';
import { TurntableMotion } from './motions/turntable.motion';
import { opening, fitOrbits, placeOrbits } from '../rules/scene-bodies.rules';
import {
  Frame,
  measureRest,
  REST_FRAME,
  referenceRadius,
} from '../rules/camera/camera-frames.rules';
import { TRAVELING_END } from '../rules/camera/traveling.rules';

const callable = (): undefined => undefined;

/** A 2D context that accepts every call: the drawing is not under test. */
const fakeContext = (): CanvasRenderingContext2D => {
  const proxy: unknown = new Proxy(callable, {
    get: () => proxy,
    set: () => true,
    apply: () => proxy,
  });
  return proxy as CanvasRenderingContext2D;
};

/** A seeded generator: the same scene on every run. */
const seeded = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
};

const bodies = (count: number): SceneInputs['bodies'] =>
  Array.from({ length: count }, (_, rank) => ({
    id: `body-${String(rank)}`,
    label: `Body ${String(rank + 1)}`,
    faint: rank >= 4,
  }));

const SHOWN: SceneDirection = { ...RESTING_DIRECTION, presence: 'shown' };

const INPUTS: SceneInputs = {
  bodies: bodies(5),
  direction: SHOWN,
  figureNames: ['Profil', 'Compétences', 'Méthode', 'Parcours'],
  paused: false,
  reduced: false,
};

const layout = (bars: number | null): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport: { width: 1280, height: 800 },
  panels: [],
  topBarHeight: bars,
  bottomBarHeight: bars,
  approachEdge: null,
  closeUpEdge: null,
});

/** What the spec reads of the hand, behind the class's back. */
interface HandView {
  readonly orbits: readonly { readonly rb: number }[];
  readonly turntable: TurntableMotion;
  readonly disk: {
    cx: number;
    cy: number;
    radius: number;
    cr: number;
    sr: number;
    squash: number;
  } | null;
}

const drivenHost = (): { host: EngineHost; step: (ms: number) => void } => {
  let clock = 0;
  let pending: ((time: number) => void) | null = null;
  const host: EngineHost = {
    frame: (callback) => {
      pending = callback;
      return () => {
        pending = null;
      };
    },
    now: () => clock,
    hidden: () => false,
  };
  const step = (ms: number): void => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 1000 / 60);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
  };
  return { host, step };
};

/**
 * An engine on a clock the spec drives: frames run when `step` says, and
 * `now` is the clock, so a gesture's speed is exact.
 */
const mount = () => {
  const { host, step } = drivenHost();
  const engine = new SpaceSceneEngine(
    host,
    { matter: fakeContext(), sky: null },
    {
      rnd: seeded(9),
      density: 200,
      figures: 'constellations',
      ink: '#000',
      accent: '#00f',
    },
    1200 * 800,
  );
  engine.setInputs(INPUTS);
  engine.setLayout({
    ...layout(null),
    viewport: { width: 1200, height: 800 },
  });
  engine.resize(1200, 800, 1);
  const view = (): HandView => engine as unknown as HandView;
  // Past the crossing: the disk at its place and its size.
  step(12_000);
  /** The screen point at `angle` in the disk's plane, `radius` out. */
  const at = (angle: number, radius = 1.6): { x: number; y: number } => {
    const disk = view().disk;
    if (!disk) {
      throw new Error('expected the disk to be drawn');
    }
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * disk.squash;
    return {
      x: disk.cx + (x * disk.cr - y * disk.sr) * disk.radius,
      y: disk.cy + (x * disk.sr + y * disk.cr) * disk.radius,
    };
  };
  /** Drags along the disk from one angle to another, in `ms`. */
  const drag = (from: number, to: number, ms: number, radius = 1.6): void => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let k = 1; k <= steps; k++) {
      const point = at(from + ((to - from) * k) / steps, radius);
      step(ms / steps);
      engine.turn(point.x, point.y);
    }
  };
  const grab = (angle: number, radius = 1.6): void => {
    const point = at(angle, radius);
    expect(engine.grab(point.x, point.y)).toBe(true);
  };
  return { engine, step, view, at, drag, grab };
};

describe('SpaceSceneEngine, turned by hand', () => {
  it('reads the disk as it lies, flattened by its opening', () => {
    const { view } = mount();
    expect(view().disk?.squash).toBeLessThan(opening(0.4));
  });

  it('follows the hand angle for angle while held', () => {
    const { engine, view, drag, grab } = mount();
    const before = view().turntable.rotor('disk').angle;
    grab(0.2);
    drag(0.2, 0.2 + Math.PI / 2, 400);
    expect(view().turntable.rotor('disk').angle - before).toBeCloseTo(
      Math.PI / 2,
      2,
    );
    drag(0.2 + Math.PI / 2, 0.2 + Math.PI / 4, 300);
    expect(view().turntable.rotor('disk').angle - before).toBeCloseTo(
      Math.PI / 4,
      2,
    );
    engine.release();
  });

  it('keeps the hand’s speed when thrown, then loses it to friction', () => {
    const { engine, step, view, drag, grab } = mount();
    grab(0);
    // A quarter turn in 150 ms: about 10.5 rad/s.
    drag(0, Math.PI / 2, 150);
    expect(engine.release()).toBe(true);
    expect(view().turntable.rotor('disk').speed).toBeGreaterThan(8);
    expect(view().turntable.rotor('disk').speed).toBeLessThan(13);
    const thrownAt = view().turntable.rotor('disk').angle;
    step(1400);
    // One half-life of friction.
    expect(view().turntable.rotor('disk').speed).toBeLessThan(6.5);
    expect(view().turntable.rotor('disk').angle - thrownAt).toBeGreaterThan(5);
    step(15_000);
    expect(view().turntable.rotor('disk').speed).toBe(0);
  });

  it('stays put when let go still', () => {
    const { engine, step, view, drag, grab } = mount();
    grab(0);
    drag(0, 1, 200);
    // The hand stops, then lets go.
    step(120);
    engine.release();
    expect(view().turntable.rotor('disk').speed).toBe(0);
    const letGo = view().turntable.rotor('disk').angle;
    step(2000);
    expect(view().turntable.rotor('disk').angle).toBe(letGo);
  });

  it('stops a spinning disk when grabbed', () => {
    const { engine, step, view, drag, grab } = mount();
    grab(0);
    drag(0, Math.PI / 2, 150);
    engine.release();
    step(300);
    expect(view().turntable.rotor('disk').speed).not.toBe(0);
    grab(1);
    expect(view().turntable.rotor('disk').speed).toBe(0);
    engine.release();
  });

  it('drags the orbits with the disk, never geared to it', () => {
    const { engine, step, view, drag, grab } = mount();
    grab(0);
    drag(0, Math.PI / 2, 150);
    engine.release();
    const thrown = view().turntable.rotor('disk').speed;
    // At once, the orbits have not caught up yet: a drag, not a gear.
    expect(Math.abs(view().turntable.rotor('orbits').speed)).toBeLessThan(
      0.4 * thrown,
    );
    step(600);
    const disk = view().turntable.rotor('disk');
    const orbits = view().turntable.rotor('orbits');
    expect(orbits.speed).toBeGreaterThan(0);
    expect(orbits.speed).toBeLessThan(0.5 * disk.speed);
    expect(orbits.angle).toBeLessThan(disk.angle);
  });

  it('takes the orbits rather than the disk far from the hole', () => {
    const { engine, step, view, drag, grab } = mount();
    const disk = view().turntable.rotor('disk').angle;
    grab(0, 5);
    drag(0, 1, 300, 5);
    expect(view().turntable.rotor('orbits').angle).toBeCloseTo(1, 2);
    engine.release();
    step(600);
    // The disk is dragged by the orbits in turn, less than they turned.
    expect(view().turntable.rotor('disk').angle - disk).toBeGreaterThan(0);
    expect(view().turntable.rotor('disk').angle - disk).toBeLessThan(1);
  });

  it.each([{ kind: 'overview' }, { kind: 'aside' }] as const)(
    'turns on the $kind framing too, where the object is seen whole',
    (framing) => {
      const { engine, step, view: read, drag, grab } = mount();
      engine.setInputs({ ...INPUTS, direction: { ...SHOWN, framing } });
      step(3000);
      const before = read().turntable.rotor('disk').angle;
      grab(0.2);
      drag(0.2, 1.2, 300);
      expect(read().turntable.rotor('disk').angle - before).toBeCloseTo(1, 2);
      engine.release();
    },
  );

  it('does not turn when the direction holds it still, framed on one planet', () => {
    const { engine, step, at } = mount();
    engine.setInputs({
      ...INPUTS,
      direction: {
        ...SHOWN,
        framing: { kind: 'approach', body: 'body-0', step: 0 },
        turnable: false,
      },
    });
    step(3000);
    const point = at(0);
    expect(engine.grab(point.x, point.y)).toBe(false);
  });

  it('turns the inner orbits faster than the outer, the one held with the hand', () => {
    const { engine, step, view, drag, grab } = mount();
    const orbits = view().orbits.map((orbit, i) => ({ i, rb: orbit.rb }));
    const held = orbits[2];
    if (!held) {
      throw new Error('expected five orbits');
    }
    grab(0, held.rb);
    drag(0, 1, 300, held.rb);
    // Read while held: the frame shares the turn out.
    step(16);
    const turns = [...view().turntable.turns()];
    engine.release();
    // The planet under the finger follows it.
    expect(turns[held.i]).toBeCloseTo(1, 1);
    // Kepler: the closer in, the more it turned.
    const byRadius = [...orbits].sort((a, b) => a.rb - b.rb);
    const shares = byRadius.map((orbit) => turns[orbit.i] ?? 0);
    for (const [k, share] of shares.slice(1).entries()) {
      expect(share).toBeLessThan(shares[k] ?? 0);
    }
  });
});

const restOf = (w: number, h: number): { frame: Frame; freeHalf: number } => {
  const measure = measureRest({ width: w, height: h }, 44, 90);
  return {
    frame: { ...REST_FRAME, ...measure },
    freeHalf: measure.freeHalf,
  };
};

const fitted = (w: number, h: number): number[] => {
  const { frame, freeHalf } = restOf(w, h);
  const orbits = placeOrbits(7);
  fitOrbits(orbits, { w, h, dpr: 1 }, frame, freeHalf);
  return orbits.map((orbit) => orbit.rb);
};

/** The room the outer orbit has across, in object radii. */
const room = (w: number, h: number): number => {
  const { frame } = restOf(w, h);
  const cx = w * frame.x;
  return (Math.min(cx, w - cx) - 74) / referenceRadius(w, h, frame.s);
};

describe('fitOrbits', () => {
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

const ignored = (): void => {};

/** A context that records what it is asked to write, and nothing else. */
const writer = (texts: string[]): CanvasRenderingContext2D =>
  new Proxy(
    {},
    {
      get: (_object, property: string) => {
        if (property === 'fillText') {
          return (text: string) => {
            texts.push(text);
          };
        }
        return property.startsWith('create')
          ? () => ({ addColorStop: ignored })
          : ignored;
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;

const FIXES_INPUTS: SceneInputs = {
  bodies: bodies(7),
  direction: SHOWN,
  figureNames: ['A', 'B', 'C', 'D'],
  paused: false,
  reduced: false,
};

const mountAt = (
  inputs: Partial<SceneInputs> = {},
  figures: 'constellations' | 'comets' = 'constellations',
) => {
  const { host, step } = drivenHost();
  const texts: string[] = [];
  const engine = new SpaceSceneEngine(
    host,
    { matter: writer(texts), sky: writer(texts) },
    {
      rnd: seeded(3),
      density: 100,
      figures,
      ink: '#fff',
      accent: '#0af',
    },
    1280 * 800,
  );
  engine.setInputs({ ...FIXES_INPUTS, ...inputs });
  engine.setLayout({
    ...layout(null),
    topBarHeight: 44,
    bottomBarHeight: 90,
  });
  engine.resize(1280, 800, 1);
  return { engine, step, texts };
};

describe('SpaceSceneEngine, fixed', () => {
  /** Its clock stood still at 0 meanwhile, and the crossing started over. */
  it('does not replay the crossing when motion is switched back on', () => {
    const { engine, step } = mountAt({ reduced: true });
    step(1000);

    engine.setInputs({ ...FIXES_INPUTS, reduced: false });
    step(100);

    const time = (engine as unknown as { motion: { clock: { time: number } } })
      .motion.clock.time;
    expect(time).toBeGreaterThanOrEqual(TRAVELING_END);
  });

  it('plays the crossing when the page opens with motion', () => {
    const { engine, step } = mountAt();
    step(1000);

    const time = (engine as unknown as { motion: { clock: { time: number } } })
      .motion.clock.time;
    expect(time).toBeLessThan(TRAVELING_END);
  });

  /** The camera's aim read last frame's radii, 1.6 at the first. */
  it('fits the orbits before the camera aims at them', () => {
    const { engine, step } = mountAt();
    step(12_000);
    const view = engine as unknown as {
      orbits: readonly { rb: number }[];
      target: () => unknown;
    };
    const seen: number[] = [];
    const before = view.orbits.at(-1)?.rb;
    const target = view.target.bind(engine);
    view.target = () => {
      seen.push(view.orbits.at(-1)?.rb ?? NaN);
      return target();
    };

    engine.setLayout(layout(220));
    step(1000 / 60);

    // The aim read radii fitted to the new room, not the last frame's.
    expect(seen[0]).not.toBe(before);
    expect(seen[0]).toBeCloseTo(view.orbits.at(-1)?.rb ?? NaN, 1);
  });

  it('bounds the lit figure by the figures there are, whatever it is asked', () => {
    const { step, texts } = mountAt(
      {
        direction: {
          ...SHOWN,
          framing: { kind: 'aside' },
          presence: 'hidden',
          figuresShown: true,
          litFigure: 9,
        },
      },
      'comets',
    );

    step(4000);

    expect(texts).toContain('D');
    expect(texts).not.toContain('undefined');
  });
});
