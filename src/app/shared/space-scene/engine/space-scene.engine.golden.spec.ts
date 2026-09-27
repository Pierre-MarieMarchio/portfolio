import { fingerprintOf } from '@testing/doubles/recording-canvas.double';
import {
  bodyId,
  mountEngineScene,
  SCENE_INPUTS,
  SceneChange,
  sceneBodies,
  SceneSetup,
  WIDE_LAYOUT,
} from '@testing/fixtures/engine-scene.fixture';
import { SceneLayout } from '../models/scene-layout.model';

const emphasised = (rank: number): SceneChange => ({
  direction: { emphasised: bodyId(rank) },
});

const closeUp = (rank: number): SceneChange => ({
  direction: { framing: { kind: 'close-up', body: bodyId(rank) } },
});

const overview = (ringed: number): SceneChange => ({
  direction: {
    framing: { kind: 'overview' },
    labels: 'tags',
    ringed: bodyId(ringed),
  },
});

const approach = (rank: number, step: number): SceneChange => ({
  direction: {
    framing: { kind: 'approach', body: bodyId(rank), step },
    turnable: false,
  },
});

const aside = (litFigure: number): SceneChange => ({
  direction: {
    framing: { kind: 'aside' },
    presence: 'hidden',
    labels: 'none',
    figuresShown: true,
    litFigure,
  },
});

const EMPTY_OVERVIEW: SceneChange = {
  direction: {
    framing: { kind: 'overview' },
    presence: 'hidden',
    labels: 'none',
    turnable: false,
  },
};

const AT_REST: SceneChange = {};

describe('SpaceSceneEngine, drawn frame for frame', () => {
  it('draws every scene exactly as it did before the refactor', () => {
    const { engine, run, styles, set: at } = mountEngineScene();
    const scene = (ms: number): string =>
      fingerprintOf([...run(ms), ...styles()]);
    const drawn: Record<string, string> = {};

    drawn['crossing'] = scene(3000);
    drawn['arrival'] = scene(9000);
    at(emphasised(1));
    drawn['rest, emphasised'] = scene(1500);
    at(closeUp(2));
    drawn['close-up'] = scene(2000);
    at(overview(3));
    drawn['overview'] = scene(3000);
    at(approach(2, 1));
    drawn['approach'] = scene(3000);
    at(aside(2));
    drawn['aside'] = scene(3000);
    at(EMPTY_OVERVIEW);
    drawn['empty overview'] = scene(2000);
    at(AT_REST);
    engine.setPointer(640, 400);
    drawn['rest, pointer'] = scene(1500);
    engine.setPointer(null);
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
  }, 60_000);
});

const GOLDEN: Record<string, string> = {
  crossing: '0561053f',
  arrival: '7d6b7a10',
  'rest, emphasised': 'e98e2e8e',
  'close-up': '4cf6cc87',
  overview: 'd94c01c2',
  approach: '63517c75',
  aside: '0b74a1ca',
  'empty overview': '06f1ed31',
  'rest, pointer': '83e4817d',
  'turned by hand': '5defcccf',
  'reduced motion': 'c73d7c01',
};

const PHONE_LAYOUT: SceneLayout = {
  canvas: { left: 0, top: 0 },
  viewport: { width: 390, height: 844 },
  panels: [{ left: 0, top: 430, right: 390, bottom: 844, opacity: 1 }],
  topBarHeight: 56,
  bottomBarHeight: 120,
  approachEdge: 0,
  closeUpEdge: 0,
  approachBandTop: 430,
  closeUpBandTop: 430,
  panelBandTop: 430,
};

const NARROW_LAYOUT: SceneLayout = {
  ...WIDE_LAYOUT,
  viewport: { width: 1024, height: 700 },
  panels: [{ left: 600, top: 60, right: 1000, bottom: 560, opacity: 0.6 }],
  approachEdge: 600,
  closeUpEdge: 700,
};

const ARRIVED = 12_000;

const mount = (setup: Partial<SceneSetup> = {}) => {
  const scene = mountEngineScene(setup);
  const print = (ms: number): string =>
    fingerprintOf([...scene.run(ms), ...scene.styles(), ...scene.attributes()]);
  return { ...scene, print };
};

const turnByHand = (scene: ReturnType<typeof mount>): string => {
  scene.engine.grab(300, 200);
  for (let k = 1; k <= 20; k++) {
    scene.engine.turn(300 + k * 12, 200 + k * 4);
    scene.run(1000 / 60);
  }
  scene.engine.release();
  return scene.print(2500);
};

describe('SpaceSceneEngine, the scenes the first golden left out', () => {
  it('draws the comets aside, lighting each in turn', () => {
    const scene = mount({ figures: 'comets' });
    scene.run(ARRIVED);
    const drawn: Record<string, string> = {};
    for (let lit = 0; lit < 4; lit++) {
      scene.set(aside(lit));
      drawn[`comet ${lit}`] = scene.print(2000);
    }
    scene.set(AT_REST);
    drawn['back at rest'] = scene.print(2000);

    expect(drawn).toEqual(SCENES_GOLDEN.comets);
  }, 60_000);

  it('draws on a screen of density 2', () => {
    const scene = mount({ dpr: 2 });
    const drawn: Record<string, string> = {};
    drawn['crossing'] = scene.print(3000);
    drawn['arrival'] = scene.print(9000);
    scene.engine.setPointer(640, 400);
    drawn['pointer'] = scene.print(1500);
    scene.engine.setPointer(null);
    drawn['turned by hand'] = turnByHand(scene);
    scene.set(approach(1, 2));
    drawn['approach'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.dpr2);
  }, 60_000);

  it('draws on a phone', () => {
    const scene = mount({ layout: PHONE_LAYOUT, dpr: 3 });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set(overview(0));
    drawn['overview'] = scene.print(3000);
    scene.set(approach(3, 0));
    drawn['approach'] = scene.print(3000);
    scene.set(closeUp(2));
    drawn['close-up'] = scene.print(2000);
    scene.set(aside(1));
    drawn['aside'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.phone);
  }, 60_000);

  it('places labels by their measured size', () => {
    const scene = mount({ labelSize: { width: 96, height: 18 } });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set(emphasised(2));
    drawn['emphasised'] = scene.print(1500);
    scene.set(overview(5));
    drawn['overview'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.measuredLabels);
  }, 60_000);

  it('starts with reduced motion, then gets motion back', () => {
    const scene = mount({ inputs: { ...SCENE_INPUTS, reduced: true } });
    const drawn: Record<string, string> = {};
    drawn['rest'] = scene.print(1500);
    scene.set({ ...approach(0, 1), reduced: true });
    drawn['approach'] = scene.print(1500);
    scene.set({ ...aside(3), reduced: true });
    drawn['aside'] = scene.print(1500);
    scene.set({ ...AT_REST, reduced: false });
    drawn['motion back'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.reducedFromStart);
  }, 60_000);

  it('draws without a sky canvas', () => {
    const scene = mount({ withSky: false });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set(aside(0));
    drawn['aside'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.noSky);
  }, 60_000);

  it('rests while paused or hidden, and resumes', () => {
    const scene = mount();
    const drawn: Record<string, string> = {};
    scene.run(ARRIVED);
    scene.set({ paused: true });
    drawn['paused'] = scene.print(2000);
    scene.engine.setVisible(false);
    drawn['hidden'] = scene.print(1000);
    const wasScheduledWhileHidden = scene.scheduled();
    scene.engine.setVisible(true);
    drawn['shown again'] = scene.print(1000);
    scene.set({ paused: false });
    drawn['resumed'] = scene.print(2000);

    expect(wasScheduledWhileHidden).toBe(false);
    expect(drawn).toEqual(SCENES_GOLDEN.pausedAndHidden);
  }, 60_000);

  it('follows a second layout', () => {
    const scene = mount();
    scene.run(ARRIVED);
    scene.engine.setLayout(NARROW_LAYOUT);
    scene.engine.resize(1024, 700, 1);
    const drawn: Record<string, string> = {};
    drawn['rest'] = scene.print(3000);
    scene.set(closeUp(1));
    drawn['close-up'] = scene.print(2000);

    expect(drawn).toEqual(SCENES_GOLDEN.secondLayout);
  }, 60_000);

  it('draws nine bodies, close-ups and approach steps past the first', () => {
    const scene = mount({
      inputs: { ...SCENE_INPUTS, bodies: sceneBodies(9) },
    });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set(closeUp(0));
    drawn['close-up first'] = scene.print(2000);
    scene.set(closeUp(3));
    drawn['close-up last bright'] = scene.print(2000);
    scene.set(overview(8));
    drawn['overview'] = scene.print(3000);
    scene.set(approach(8, 3));
    drawn['approach'] = scene.print(3000);

    expect(drawn).toEqual(SCENES_GOLDEN.nineBodies);
  }, 60_000);
});

const SCENES_GOLDEN = {
  comets: {
    'comet 0': '2c0ee364',
    'comet 1': 'c8b7b944',
    'comet 2': 'd07d3dbd',
    'comet 3': 'ffc43497',
    'back at rest': '7fb9909b',
  },
  dpr2: {
    crossing: 'badb3cef',
    arrival: '6b67e339',
    pointer: '1307711b',
    'turned by hand': '4a447fba',
    approach: '318c3ecc',
  },
  phone: {
    arrival: 'e757d049',
    overview: '81b82e52',
    approach: 'ff1beec4',
    'close-up': 'be6d19aa',
    aside: '3e060612',
  },
  measuredLabels: {
    arrival: '29a2446b',
    emphasised: 'c40c9eed',
    overview: 'c5538b56',
  },
  reducedFromStart: {
    rest: 'c2f3041b',
    approach: 'ec7a18b2',
    aside: 'b1584e42',
    'motion back': 'e1b6a9ec',
  },
  noSky: {
    arrival: 'f5ddcadb',
    aside: '8b470e0a',
  },
  pausedAndHidden: {
    paused: '72759d6f',
    hidden: 'f695e24b',
    'shown again': 'f695e24b',
    resumed: 'f5472e76',
  },
  secondLayout: {
    rest: '216fd9b9',
    'close-up': 'e4698a7d',
  },
  nineBodies: {
    arrival: '89a4f92f',
    'close-up first': 'a3a250b2',
    'close-up last bright': 'c4b128e7',
    overview: '27fd97e8',
    approach: '0495899e',
  },
} satisfies Record<string, Record<string, string>>;
