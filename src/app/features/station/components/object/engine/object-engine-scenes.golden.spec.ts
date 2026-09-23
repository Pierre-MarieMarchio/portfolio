import { Layout } from './object-engine';
import { fingerprintOf } from '@testing/doubles/recording-canvas.double';
import {
  DESKTOP_LAYOUT,
  mountEngineScene,
  SCENE_INPUTS,
  SceneSetup,
} from '@testing/fixtures/engine-scene.fixture';

const PHONE_LAYOUT: Layout = {
  canvas: { left: 0, top: 0 },
  viewport: { width: 390, height: 844 },
  panels: [{ left: 0, top: 430, right: 390, bottom: 844, opacity: 1 }],
  headHeight: 56,
  ruleHeight: 120,
  sheetLeft: null,
  previewLeft: null,
};

const NARROW_LAYOUT: Layout = {
  ...DESKTOP_LAYOUT,
  viewport: { width: 1024, height: 700 },
  panels: [{ left: 600, top: 60, right: 1000, bottom: 560, opacity: 0.6 }],
  sheetLeft: 600,
  previewLeft: 700,
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

describe('ObjectEngine, the scenes the first golden left out', () => {
  it('draws "about" with comets, part by part', () => {
    const scene = mount({ aboutBodies: 'comets' });
    scene.run(ARRIVED);
    const drawn: Record<string, string> = {};
    for (let part = 0; part < 4; part++) {
      scene.set({ view: 'about', part });
      drawn[`part ${part}`] = scene.print(2000);
    }
    scene.set({ view: 'home' });
    drawn['back home'] = scene.print(2000);

    expect(drawn).toEqual(GOLDEN.comets);
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
    scene.set({ view: 'sheet', focus: 1, chapter: 2 });
    drawn['sheet'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.dpr2);
  }, 60_000);

  it('draws on a phone', () => {
    const scene = mount({ layout: PHONE_LAYOUT, dpr: 3 });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set({ view: 'index', selected: 0 });
    drawn['index'] = scene.print(3000);
    scene.set({ view: 'sheet', focus: 3, chapter: 0 });
    drawn['sheet'] = scene.print(3000);
    scene.set({ view: 'about', part: 1 });
    drawn['about'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.phone);
  }, 60_000);

  it('places labels by their measured size', () => {
    const scene = mount({ labelSize: { width: 96, height: 18 } });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set({ hovered: 2 });
    drawn['hovered'] = scene.print(1500);
    scene.set({ view: 'index', selected: 5 });
    drawn['index'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.measuredLabels);
  }, 60_000);

  it('starts with reduced motion, then gets motion back', () => {
    const scene = mount({ inputs: { ...SCENE_INPUTS, reduced: true } });
    const drawn: Record<string, string> = {};
    drawn['home'] = scene.print(1500);
    scene.set({ reduced: true, view: 'sheet', focus: 0, chapter: 1 });
    drawn['sheet'] = scene.print(1500);
    scene.set({ reduced: true, view: 'about', part: 3 });
    drawn['about'] = scene.print(1500);
    scene.set({ reduced: false, view: 'home' });
    drawn['motion back'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.reducedFromStart);
  }, 60_000);

  it('draws without a sky canvas', () => {
    const scene = mount({ withSky: false });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set({ view: 'about', part: 0 });
    drawn['about'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.noSky);
  }, 60_000);

  it('rests while paused or hidden, and resumes', () => {
    const scene = mount();
    const drawn: Record<string, string> = {};
    scene.run(ARRIVED);
    scene.set({ paused: true });
    drawn['paused'] = scene.print(2000);
    scene.engine.setVisible(false);
    drawn['hidden'] = scene.print(1000);
    const scheduledWhileHidden = scene.scheduled();
    scene.engine.setVisible(true);
    drawn['shown again'] = scene.print(1000);
    scene.set({ paused: false });
    drawn['resumed'] = scene.print(2000);

    expect(scheduledWhileHidden).toBe(false);
    expect(drawn).toEqual(GOLDEN.pausedAndHidden);
  }, 60_000);

  it('follows a second layout', () => {
    const scene = mount();
    scene.run(ARRIVED);
    scene.engine.setLayout(NARROW_LAYOUT);
    scene.engine.resize(1024, 700, 1);
    const drawn: Record<string, string> = {};
    drawn['home'] = scene.print(3000);
    scene.set({ preview: 1 });
    drawn['preview'] = scene.print(2000);

    expect(drawn).toEqual(GOLDEN.secondLayout);
  }, 60_000);

  it('draws nine projects, previews and chapters past the first', () => {
    const scene = mount({ inputs: { ...SCENE_INPUTS, count: 9 } });
    const drawn: Record<string, string> = {};
    drawn['arrival'] = scene.print(ARRIVED);
    scene.set({ preview: 0 });
    drawn['preview first'] = scene.print(2000);
    scene.set({ preview: 3 });
    drawn['preview last featured'] = scene.print(2000);
    scene.set({ view: 'index', selected: 8 });
    drawn['index'] = scene.print(3000);
    scene.set({ view: 'sheet', focus: 8, chapter: 3 });
    drawn['sheet'] = scene.print(3000);

    expect(drawn).toEqual(GOLDEN.nineProjects);
  }, 60_000);
});

const GOLDEN = {
  comets: {
    'part 0': '2c0ee364',
    'part 1': 'c8b7b944',
    'part 2': 'd07d3dbd',
    'part 3': 'ffc43497',
    'back home': '7fb9909b',
  },
  dpr2: {
    crossing: 'badb3cef',
    arrival: '6b67e339',
    pointer: '1307711b',
    'turned by hand': '4a447fba',
    sheet: '318c3ecc',
  },
  phone: {
    arrival: 'bc6dd0b8',
    index: 'fe55540e',
    sheet: 'eaa07063',
    about: '0598f29b',
  },
  measuredLabels: {
    arrival: '29a2446b',
    hovered: 'c40c9eed',
    index: 'c5538b56',
  },
  reducedFromStart: {
    home: 'c2f3041b',
    sheet: 'ec7a18b2',
    about: 'b1584e42',
    'motion back': 'e1b6a9ec',
  },
  noSky: {
    arrival: 'f5ddcadb',
    about: '8b470e0a',
  },
  pausedAndHidden: {
    paused: '72759d6f',
    hidden: 'f695e24b',
    'shown again': 'f695e24b',
    resumed: 'f5472e76',
  },
  secondLayout: {
    home: '216fd9b9',
    preview: 'e4698a7d',
  },
  nineProjects: {
    arrival: '89a4f92f',
    'preview first': 'a3a250b2',
    'preview last featured': 'c4b128e7',
    index: '27fd97e8',
    sheet: '0495899e',
  },
} satisfies Record<string, Record<string, string>>;
