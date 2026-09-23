import { EngineInputs, ObjectEngine } from './object-engine';
import { Turntable } from './turntable';
import { opening } from './scene';

/** A 2D context that accepts every call: the drawing is not under test. */
const fakeContext = (): CanvasRenderingContext2D => {
  const target = (): undefined => undefined;
  const proxy: unknown = new Proxy(target, {
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
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const INPUTS: EngineInputs = {
  count: 5,
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

/** What the spec reads of the hand, behind the class's back. */
interface HandView {
  readonly orbits: readonly { readonly rb: number }[];
  readonly turntable: Turntable;
  readonly disk: {
    cx: number;
    cy: number;
    R: number;
    cr: number;
    sr: number;
    squash: number;
  } | null;
}

/**
 * An engine on a clock the spec drives: frames run when `step` says, and
 * `now` is the clock, so a gesture's speed is exact.
 */
const mount = () => {
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
    fakeContext(),
    null,
    {
      rnd: seeded(9),
      density: 200,
      aboutBodies: 'constellations',
      ink: '#000',
      accent: '#00f',
    },
    1200 * 800,
  );
  engine.setInputs(INPUTS);
  engine.setLayout({
    canvas: { left: 0, top: 0 },
    viewport: { width: 1200, height: 800 },
    panels: [],
    headHeight: null,
    ruleHeight: null,
    sheetLeft: null,
    previewLeft: null,
  });
  engine.resize(1200, 800, 1);
  const step = (ms: number): void => {
    const end = clock + ms;
    while (clock < end) {
      clock = Math.min(end, clock + 1000 / 60);
      const callback = pending;
      pending = null;
      callback?.(clock);
    }
  };
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
      x: disk.cx + (x * disk.cr - y * disk.sr) * disk.R,
      y: disk.cy + (x * disk.sr + y * disk.cr) * disk.R,
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

describe('ObjectEngine, turned by hand', () => {
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

  it.each(['index', 'about'] as const)(
    'turns on the %s view too, where the object is seen whole',
    (view) => {
      const { engine, step, view: read, drag, grab } = mount();
      engine.setInputs({ ...INPUTS, view });
      step(3000);
      const before = read().turntable.rotor('disk').angle;
      grab(0.2);
      drag(0.2, 1.2, 300);
      expect(read().turntable.rotor('disk').angle - before).toBeCloseTo(1, 2);
      engine.release();
    },
  );

  it('does not turn on a sheet, framed on one planet', () => {
    const { engine, step, at } = mount();
    engine.setInputs({ ...INPUTS, view: 'sheet', focus: 0 });
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
    shares.slice(1).forEach((share, k) => {
      expect(share).toBeLessThan(shares[k] ?? 0);
    });
  });
});
