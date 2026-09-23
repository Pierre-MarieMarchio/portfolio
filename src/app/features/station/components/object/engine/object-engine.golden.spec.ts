import { fingerprintOf } from '@testing/doubles/recording-canvas.double';
import { mountEngineScene } from '@testing/fixtures/engine-scene.fixture';

describe('ObjectEngine, drawn frame for frame', () => {
  it('draws every scene exactly as it did before the refactor', () => {
    const { engine, run, styles, set: at } = mountEngineScene();
    const scene = (ms: number): string =>
      fingerprintOf([...run(ms), ...styles()]);
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
