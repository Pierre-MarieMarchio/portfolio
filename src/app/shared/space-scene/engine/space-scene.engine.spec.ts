import { SpaceSceneEngine } from './space-scene.engine';
import { SceneDirection, SceneInputs } from '../models/scene.model';
import { SceneLayout } from '../models/scene-layout.model';
import { TurntableMotion } from './motions/turntable.motion';
import {
  fitOrbits,
  placeOrbits,
  positionOrbit,
} from '../rules/scene-bodies.rules';
import {
  flattening,
  opening,
  rollFlatten,
} from '../rules/camera/projection.rules';
import {
  APPROACHES,
  Frame,
  measureRest,
  REST_FRAME,
  referenceRadius,
} from '../rules/camera/camera-frames.rules';
import { TRAVELING_END } from '../rules/camera/traveling.rules';
import { drivenHost, FRAME_MS } from '@testing/doubles/driven-host.double';
import { seededRandom } from '@testing/doubles/seeded-random.double';
import {
  bodyId,
  mountEngineScene,
  SCENE_INPUTS,
  sceneBodies,
} from '@testing/fixtures/engine-scene.fixture';
import { sceneLayout } from '../rules/scene-layout.rules';

const callable = (): undefined => undefined;

const silentContext = (): CanvasRenderingContext2D => {
  const proxy: unknown = new Proxy(callable, {
    get: () => proxy,
    set: () => true,
    apply: () => proxy,
  });
  return proxy as CanvasRenderingContext2D;
};

const SHOWN: SceneDirection = SCENE_INPUTS.direction;

const FRICTION_HALF_LIFE_MS = 1400;
const STILL_BEFORE_LETTING_GO_MS = 120;

const INPUTS: SceneInputs = { ...SCENE_INPUTS, bodies: sceneBodies(5) };

const PAST_CROSSING_MS = 12_000;

const layout = (bars: number | null): SceneLayout => ({
  canvas: { left: 0, top: 0 },
  viewport: { width: 1280, height: 800 },
  panels: [],
  topBarHeight: bars,
  bottomBarHeight: bars,
  approachEdge: null,
  closeUpEdge: null,
});

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

const mount = () => {
  const { host, step } = drivenHost();
  const engine = new SpaceSceneEngine(
    host,
    { matter: silentContext(), sky: null },
    {
      rnd: seededRandom(9),
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
  step(PAST_CROSSING_MS);
  const onDisk = (angle: number, radius = 1.6): { x: number; y: number } => {
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
  const drag = (from: number, to: number, ms: number, radius = 1.6): void => {
    const steps = Math.max(1, Math.round(ms / FRAME_MS));
    for (let k = 1; k <= steps; k++) {
      const point = onDisk(from + ((to - from) * k) / steps, radius);
      step(ms / steps);
      engine.turn(point.x, point.y);
    }
  };
  const grab = (angle: number, radius = 1.6): void => {
    const point = onDisk(angle, radius);
    expect(engine.grab(point.x, point.y)).toBe(true);
  };
  return { engine, step, view, onDisk, drag, grab };
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
    drag(0, Math.PI / 2, 150);
    expect(engine.release()).toBe(true);
    expect(view().turntable.rotor('disk').speed).toBeGreaterThan(8);
    expect(view().turntable.rotor('disk').speed).toBeLessThan(13);
    const thrownAt = view().turntable.rotor('disk').angle;
    step(FRICTION_HALF_LIFE_MS);
    expect(view().turntable.rotor('disk').speed).toBeLessThan(6.5);
    expect(view().turntable.rotor('disk').angle - thrownAt).toBeGreaterThan(5);
    step(15_000);
    expect(view().turntable.rotor('disk').speed).toBe(0);
  });

  it('stays put when let go still', () => {
    const { engine, step, view, drag, grab } = mount();
    grab(0);
    drag(0, 1, 200);
    step(STILL_BEFORE_LETTING_GO_MS);
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
    const { engine, step, onDisk } = mount();
    engine.setInputs({
      ...INPUTS,
      direction: {
        ...SHOWN,
        framing: { kind: 'approach', body: 'body-0', step: 0 },
        turnable: false,
      },
    });
    step(3000);
    const point = onDisk(0);
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
    step(16);
    const turns = [...view().turntable.turns()];
    engine.release();
    expect(turns[held.i]).toBeCloseTo(1, 1);
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

  it('keeps the outer orbit in the frame on a phone', () => {
    expect(room(375, 667)).toBeLessThan(4.6);
    expect(Math.max(...fitted(375, 667))).toBeLessThanOrEqual(
      room(375, 667) + 1e-9,
    );
  });

  it.each([1, 3])(
    'keeps the widest orbit within the width of a 360 × 780 portrait (dpr %i)',
    (dpr) => {
      const w = 360 * dpr;
      const h = 780 * dpr;
      const { frame, freeHalf } = restOf(360, 780);
      const orbits = placeOrbits(7);
      fitOrbits(orbits, { w, h, dpr }, frame, freeHalf);
      const view = {
        flatten: flattening(frame.ev),
        cr: Math.cos(frame.i),
        sr: Math.sin(frame.i),
      };
      const radius = referenceRadius(w, h, frame.s);
      const xs = orbits.flatMap((orbit) =>
        Array.from({ length: 84 }, (_, k) => {
          const point = positionOrbit(
            orbit,
            { phase: 0, elev: frame.ev, azim: (k / 84) * 2 * Math.PI },
            { x: 0, y: 0, z: 0 },
          );
          const { nx } = rollFlatten(point, view, { nx: 0, ny: 0 });
          return w * frame.x + nx * radius;
        }),
      );
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(w);
    },
  );

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

const textRecorder = (texts: string[]): CanvasRenderingContext2D =>
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
  ...SCENE_INPUTS,
  figureNames: ['A', 'B', 'C', 'D'],
};

const mountAt = (
  inputs: Partial<SceneInputs> = {},
  figures: 'constellations' | 'comets' = 'constellations',
) => {
  const { host, step } = drivenHost();
  const texts: string[] = [];
  const engine = new SpaceSceneEngine(
    host,
    { matter: textRecorder(texts), sky: textRecorder(texts) },
    {
      rnd: seededRandom(3),
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

  it('fits the orbits before the camera aims at them', () => {
    const { engine, step } = mountAt();
    step(PAST_CROSSING_MS);
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
    step(FRAME_MS);

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

const TOP_BAR = 56;
const PLANET_REACH = 6.6 * 1.18 * 4.8;

const rectOf = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const bottomPanelLayout = (width: number, height: number): SceneLayout => {
  const top = Math.round(height * 0.55);
  const panel = rectOf(0, top, width, height - top);
  return sceneLayout({ left: 0, top: 0 }, { width, height }, [
    { rect: rectOf(0, 0, width, TOP_BAR), opacity: '1', role: 'top-bar' },
    { rect: panel, opacity: '1', role: 'approach-edge' },
    { rect: panel, opacity: '1', role: 'close-up-edge' },
  ]);
};

const buttonAt = (
  styles: readonly string[],
  rank: number,
): { x: number; y: number } => {
  const match = /translate\((-?[\d.]+)px, ?(-?[\d.]+)px\)/.exec(
    styles[rank] ?? '',
  );
  if (!match) {
    throw new Error(`expected body ${String(rank)} to be placed`);
  }
  return { x: Number(match[1]), y: Number(match[2]) };
};

const PORTRAITS = [
  { width: 390, height: 844, dpr: 3 },
  { width: 390, height: 844, dpr: 1 },
  { width: 360, height: 780, dpr: 3 },
  { width: 360, height: 780, dpr: 1 },
] as const;

const FRAMED_RANKS = [0, 3] as const;

const expectInSkyBand = (
  at: { x: number; y: number },
  screen: { width: number; height: number },
): void => {
  const panelTop = Math.round(screen.height * 0.55);
  expect(at.y - PLANET_REACH).toBeGreaterThanOrEqual(TOP_BAR);
  expect(at.y + PLANET_REACH).toBeLessThanOrEqual(panelTop);
  expect(Math.abs(at.x - screen.width / 2)).toBeLessThan(0.1 * screen.width);
};

describe('SpaceSceneEngine, above a panel along the bottom', () => {
  it.each(PORTRAITS)(
    'places the approached body between the top bar and the panel, at every step ($width × $height, dpr $dpr)',
    (screen) => {
      const scene = mountEngineScene({
        layout: bottomPanelLayout(screen.width, screen.height),
        dpr: screen.dpr,
      });
      scene.run(PAST_CROSSING_MS);
      for (const rank of FRAMED_RANKS) {
        for (const step of APPROACHES.keys()) {
          scene.set({
            direction: {
              framing: { kind: 'approach', body: bodyId(rank), step },
              turnable: false,
            },
          });
          scene.run(4000);
          expectInSkyBand(buttonAt(scene.styles(), rank), screen);
          expect(scene.attributes()[rank]).not.toMatch(/^true/);
        }
      }
    },
    60_000,
  );

  it.each(PORTRAITS)(
    'places the close-up body between the top bar and the panel ($width × $height, dpr $dpr)',
    (screen) => {
      const scene = mountEngineScene({
        layout: bottomPanelLayout(screen.width, screen.height),
        dpr: screen.dpr,
      });
      scene.run(PAST_CROSSING_MS);
      for (const rank of FRAMED_RANKS) {
        scene.set({
          direction: { framing: { kind: 'close-up', body: bodyId(rank) } },
        });
        scene.run(4000);
        expectInSkyBand(buttonAt(scene.styles(), rank), screen);
        expect(scene.attributes()[rank]).not.toMatch(/^true/);
      }
    },
    60_000,
  );
});

const grainCounter = (): {
  readonly context: CanvasRenderingContext2D;
  readonly take: () => number;
} => {
  let count = 0;
  const context = new Proxy(
    {},
    {
      get: (_object, property: string) => {
        if (property === 'fillRect') {
          return () => {
            count++;
          };
        }
        return property.startsWith('create')
          ? () => ({ addColorStop: ignored })
          : ignored;
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;
  const take = (): number => {
    const taken = count;
    count = 0;
    return taken;
  };
  return { context, take };
};

const mountSized = (width: number, height: number) => {
  const { host, step } = drivenHost();
  const counter = grainCounter();
  const engine = new SpaceSceneEngine(
    host,
    { matter: counter.context, sky: null },
    {
      rnd: seededRandom(5),
      density: 3800,
      figures: 'constellations',
      ink: '#fff',
      accent: '#0af',
    },
    width * height,
  );
  engine.setInputs(INPUTS);
  engine.setLayout({ ...layout(44), viewport: { width, height } });
  engine.resize(width, height, 1);
  step(PAST_CROSSING_MS);
  const grainsDrawn = (): number => {
    counter.take();
    step(FRAME_MS);
    return counter.take();
  };
  return { engine, step, grainsDrawn };
};

describe('SpaceSceneEngine, grain density', () => {
  it('lights more grains once a phone window grows to a desktop one, without a jump', () => {
    const { engine, step, grainsDrawn } = mountSized(390, 844);
    const before = grainsDrawn();

    engine.setViewportArea(1280 * 800);
    const next = grainsDrawn();
    step(4000);
    const after = grainsDrawn();

    expect(next).toBeLessThan(before * 1.15);
    expect(after).toBeGreaterThan(before * 2);
  });

  it('lights fewer grains once a desktop window shrinks to a phone one', () => {
    const { engine, step, grainsDrawn } = mountSized(1280, 800);
    const before = grainsDrawn();

    engine.setViewportArea(390 * 844);
    step(4000);

    expect(grainsDrawn()).toBeLessThan(before * 0.5);
  });

  it('keeps the density across a rotation, the area being the same', () => {
    const rotated = mountSized(390, 844);
    const unturned = mountSized(390, 844);

    rotated.engine.setViewportArea(844 * 390);
    rotated.step(4000);
    unturned.step(4000);

    expect(rotated.grainsDrawn()).toBe(unturned.grainsDrawn());
  });
});

const GLASS_TOP_SHARE = 0.6;
const BUTTON_HALF = 24;

const glassLayout = (
  width: number,
  height: number,
  glassTop = Math.round(height * GLASS_TOP_SHARE),
): SceneLayout =>
  sceneLayout({ left: 0, top: 0 }, { width, height }, [
    { rect: rectOf(0, 0, width, TOP_BAR), opacity: '1', role: 'top-bar' },
    {
      rect: rectOf(0, glassTop, width, height - glassTop),
      opacity: '1',
      role: '',
    },
  ]);

const WHOLE_OBJECT_SCENES: readonly (readonly [
  string,
  Partial<SceneDirection>,
])[] = [
  ['overview', { framing: { kind: 'overview' }, labels: 'tags' }],
  [
    'aside',
    {
      framing: { kind: 'aside' },
      presence: 'hidden',
      labels: 'none',
      figuresShown: true,
    },
  ],
  [
    'not-found',
    {
      framing: { kind: 'overview' },
      presence: 'hidden',
      labels: 'none',
      turnable: false,
    },
  ],
];

interface HoleSeen {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

const markedScene = (layout: SceneLayout, dpr: number) => {
  const scene = mountEngineScene({ layout, dpr });
  const mark = document.createElement('div');
  scene.engine.setHoleMark(mark);
  const hole = (): HoleSeen => ({
    x: Number(mark.dataset['holeX']),
    y: Number(mark.dataset['holeY']),
    radius: Number(mark.dataset['holeRadius']),
  });
  const outerReach = (): number =>
    Math.max(
      ...(scene.engine as unknown as HandView).orbits.map((orbit) => orbit.rb),
    );
  return { ...scene, hole, outerReach };
};

const UPRIGHT_PHONES = [
  ...PORTRAITS,
  { width: 320, height: 568, dpr: 2 },
] as const;

describe('SpaceSceneEngine, the whole object above a window along the bottom', () => {
  it.each(UPRIGHT_PHONES)(
    'centres the hole in the sky band and keeps the outer orbit within the width ($width × $height, dpr $dpr)',
    (screen) => {
      const glassTop = Math.round(screen.height * GLASS_TOP_SHARE);
      const scene = markedScene(
        glassLayout(screen.width, screen.height),
        screen.dpr,
      );
      scene.run(PAST_CROSSING_MS);
      for (const [name, direction] of WHOLE_OBJECT_SCENES) {
        scene.set({ direction });
        scene.run(4000);
        const hole = scene.hole();
        const reach = scene.outerReach() * hole.radius;

        expect(hole.y, `${name}, below the bar`).toBeGreaterThan(TOP_BAR);
        expect(hole.y, `${name}, above the glass`).toBeLessThan(glassTop);
        expect(hole.x - reach, `${name}, left edge`).toBeGreaterThanOrEqual(0);
        expect(hole.x + reach, `${name}, right edge`).toBeLessThanOrEqual(
          screen.width,
        );
      }
    },
    60_000,
  );

  it.each(UPRIGHT_PHONES)(
    'keeps every planet of the overview between the bar and the glass ($width × $height, dpr $dpr)',
    (screen) => {
      const glassTop = Math.round(screen.height * GLASS_TOP_SHARE);
      const scene = markedScene(
        glassLayout(screen.width, screen.height),
        screen.dpr,
      );
      scene.run(PAST_CROSSING_MS);
      scene.set({ direction: WHOLE_OBJECT_SCENES[0]?.[1] ?? {} });
      scene.run(4000);
      for (const rank of SCENE_INPUTS.bodies.keys()) {
        const at = buttonAt(scene.styles(), rank);

        expect(at.y - BUTTON_HALF).toBeGreaterThanOrEqual(TOP_BAR);
        expect(at.y + BUTTON_HALF).toBeLessThanOrEqual(glassTop);
        expect(at.x - BUTTON_HALF).toBeGreaterThanOrEqual(0);
        expect(at.x + BUTTON_HALF).toBeLessThanOrEqual(screen.width);
      }
    },
    60_000,
  );

  it('glides lower when the glass folds, and back when it unfolds', () => {
    const { width, height } = { width: 390, height: 844 };
    const scene = markedScene(glassLayout(width, height), 3);
    scene.run(PAST_CROSSING_MS);
    scene.set({ direction: WHOLE_OBJECT_SCENES[0]?.[1] ?? {} });
    scene.run(4000);
    const lowered = scene.hole().y;

    scene.engine.setLayout(glassLayout(width, height, height - 57));
    scene.run(FRAME_MS);
    const firstStep = scene.hole().y;
    scene.run(4000);
    const folded = scene.hole().y;

    scene.engine.setLayout(glassLayout(width, height));
    scene.run(4000);

    expect(folded - lowered).toBeGreaterThan(0.15 * height);
    expect(firstStep - lowered).toBeGreaterThan(0);
    expect(firstStep - lowered).toBeLessThan(0.2 * (folded - lowered));
    expect(scene.hole().y).toBeCloseTo(lowered, 0);
  });

  it('follows the folded glass at once under reduced motion', () => {
    const { width, height } = { width: 390, height: 844 };
    const scene = markedScene(glassLayout(width, height), 3);
    scene.set({
      direction: WHOLE_OBJECT_SCENES[0]?.[1] ?? {},
      reduced: true,
    });
    scene.run(1000);
    const lowered = scene.hole().y;
    scene.engine.setLayout(glassLayout(width, height, height - 57));
    scene.run(FRAME_MS);
    const firstStep = scene.hole().y;
    scene.run(2000);

    expect(firstStep - lowered).toBeGreaterThan(0.15 * height);
    expect(firstStep).toBeCloseTo(scene.hole().y, 0);
  });
});

const TABLET_UPRIGHT = { width: 820, height: 1180, dpr: 2 } as const;
const TABLET_PANEL_LEFT = 317;

const sidePanelLayout = (): SceneLayout =>
  sceneLayout(
    { left: 0, top: 0 },
    { width: TABLET_UPRIGHT.width, height: TABLET_UPRIGHT.height },
    [
      { rect: rectOf(381, 40, 406, 52), opacity: '1', role: 'top-bar' },
      {
        rect: rectOf(TABLET_PANEL_LEFT, 106, 470, 920),
        opacity: '1',
        role: '',
      },
    ],
  );

describe('SpaceSceneEngine, the whole object beside a window on an upright tablet', () => {
  it('keeps the hole left of the window, and on screen', () => {
    const scene = markedScene(sidePanelLayout(), TABLET_UPRIGHT.dpr);
    scene.run(PAST_CROSSING_MS);
    for (const [name, direction] of WHOLE_OBJECT_SCENES) {
      scene.set({ direction });
      scene.run(4000);
      const hole = scene.hole();

      expect(hole.x, `${name}, left of the window`).toBeLessThan(
        TABLET_PANEL_LEFT,
      );
      expect(hole.x - hole.radius, `${name}, left edge`).toBeGreaterThanOrEqual(
        0,
      );
      expect(hole.y - hole.radius, `${name}, top edge`).toBeGreaterThanOrEqual(
        0,
      );
      expect(hole.y + hole.radius, `${name}, bottom edge`).toBeLessThanOrEqual(
        TABLET_UPRIGHT.height,
      );
    }
  }, 60_000);

  it('keeps every planet of the overview left of the window', () => {
    const scene = markedScene(sidePanelLayout(), TABLET_UPRIGHT.dpr);
    scene.run(PAST_CROSSING_MS);
    scene.set({ direction: WHOLE_OBJECT_SCENES[0]?.[1] ?? {} });
    scene.run(4000);
    for (const rank of SCENE_INPUTS.bodies.keys()) {
      const at = buttonAt(scene.styles(), rank);

      expect(at.x - BUTTON_HALF).toBeGreaterThanOrEqual(0);
      expect(at.x + BUTTON_HALF).toBeLessThanOrEqual(TABLET_PANEL_LEFT);
    }
  }, 60_000);
});
