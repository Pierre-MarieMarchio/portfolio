import { ObservatoryView, Planet } from '../models';
import {
  ObservatoryScene,
  sceneBodiesOf,
  sceneDirectionOf,
} from './scene-direction.rules';

const scene = (
  view: ObservatoryView,
  overrides: Partial<ObservatoryScene> = {},
): ObservatoryScene => ({
  view,
  sheet: null,
  chapter: 0,
  part: 0,
  preview: null,
  hovered: null,
  selected: null,
  revealed: true,
  phone: false,
  designated: null,
  ...overrides,
});

const PLANETS: readonly Planet[] = [
  { slug: 'voice', title: 'Skyted Voice', short: 'Voice' },
  { slug: 'app', title: 'Skyted App', short: 'App' },
  { slug: 'lib', title: 'ngx-statewise', short: 'statewise' },
];

describe('sceneDirectionOf', () => {
  it('rests on the home page, and holds the planets until the rest arrives', () => {
    expect(sceneDirectionOf(scene('home', { revealed: false }))).toEqual({
      framing: { kind: 'rest' },
      presence: 'withheld',
      labels: 'names',
      emphasised: null,
      aimed: null,
      ringed: null,
      turnable: true,
      figuresShown: false,
      litFigure: 0,
      landed: false,
    });
    expect(sceneDirectionOf(scene('home')).presence).toBe('shown');
  });

  it.each<ObservatoryView>(['home', 'index', 'sheet', 'about', 'not-found'])(
    'lands the scene on "%s" once the rest has arrived, and only then',
    (view) => {
      expect(sceneDirectionOf(scene(view, { revealed: false })).landed).toBe(
        false,
      );
      expect(sceneDirectionOf(scene(view)).landed).toBe(true);
    },
  );

  it('leaves the name of the designated planet to the rule, on a phone', () => {
    expect(
      sceneDirectionOf(scene('home', { phone: true, hovered: 'app' })),
    ).toMatchObject({ labels: 'none', emphasised: 'app' });
    expect(
      sceneDirectionOf(scene('home', { phone: true, preview: 'app' })).labels,
    ).toBe('names');
    expect(sceneDirectionOf(scene('home')).labels).toBe('names');
  });

  it('lights the planet the rule designates at rest, on a phone', () => {
    const onPhone = { phone: true, designated: 'voice' };

    expect(sceneDirectionOf(scene('home', onPhone)).emphasised).toBe('voice');
    expect(
      sceneDirectionOf(scene('home', { ...onPhone, hovered: 'app' }))
        .emphasised,
    ).toBe('app');
    expect(
      sceneDirectionOf(scene('home', { ...onPhone, preview: 'app' }))
        .emphasised,
    ).toBeNull();
    expect(
      sceneDirectionOf(scene('home', { designated: 'voice' })).emphasised,
    ).toBeNull();
    expect(sceneDirectionOf(scene('index', onPhone)).emphasised).toBeNull();
  });

  it('names the planet that is passed over on a phone without aiming the camera at it', () => {
    const onPhone = { phone: true, designated: 'voice' };

    expect(
      sceneDirectionOf(scene('home', { ...onPhone, hovered: 'app' })),
    ).toMatchObject({ emphasised: 'app', aimed: 'voice' });
    expect(sceneDirectionOf(scene('home', onPhone)).aimed).toBe('voice');
  });

  it('aims the camera at the planet that is hovered, off a phone', () => {
    expect(
      sceneDirectionOf(scene('home', { hovered: 'app', designated: 'voice' }))
        .aimed,
    ).toBe('app');
  });

  it('closes up on the planet of the preview, on the home page only', () => {
    expect(sceneDirectionOf(scene('home', { preview: 'app' })).framing).toEqual(
      { kind: 'close-up', body: 'app' },
    );
    expect(
      sceneDirectionOf(scene('index', { preview: 'app' })).framing,
    ).toEqual({ kind: 'overview' });
  });

  it('shows the whole system on the index, numbered, the selection ringed', () => {
    expect(
      sceneDirectionOf(scene('index', { selected: 'lib', hovered: 'app' })),
    ).toMatchObject({
      framing: { kind: 'overview' },
      presence: 'shown',
      labels: 'tags',
      emphasised: 'app',
      ringed: 'lib',
      turnable: true,
    });
  });

  it('rings the selection on the index only', () => {
    for (const view of ['home', 'sheet', 'about', 'not-found'] as const) {
      expect(
        sceneDirectionOf(scene(view, { selected: 'lib' })).ringed,
      ).toBeNull();
    }
  });

  it('approaches the planet of the sheet, one step per chapter, held still', () => {
    expect(
      sceneDirectionOf(scene('sheet', { sheet: 'voice', chapter: 2 })),
    ).toMatchObject({
      framing: { kind: 'approach', body: 'voice', step: 2 },
      presence: 'shown',
      labels: 'names',
      turnable: false,
    });
  });

  it('steps aside on "about", its part lit among the figures', () => {
    expect(sceneDirectionOf(scene('about', { part: 3 }))).toMatchObject({
      framing: { kind: 'aside' },
      presence: 'hidden',
      labels: 'none',
      turnable: true,
      figuresShown: true,
      litFigure: 3,
    });
  });

  it('shows an empty system, held still, at an unknown address', () => {
    expect(sceneDirectionOf(scene('not-found'))).toMatchObject({
      framing: { kind: 'overview' },
      presence: 'hidden',
      labels: 'none',
      turnable: false,
      figuresShown: false,
    });
  });
});

describe('sceneBodiesOf', () => {
  it('names each planet by its short name, the ones past the featured faint', () => {
    expect(sceneBodiesOf(PLANETS, 'home', 2)).toEqual([
      { id: 'voice', label: 'Voice', faint: false },
      { id: 'app', label: 'App', faint: false },
      { id: 'lib', label: 'statewise', faint: true },
    ]);
  });

  it('numbers them like the index column on the index', () => {
    expect(
      sceneBodiesOf(PLANETS, 'index', 4).map((body) => body.label),
    ).toEqual(['01', '02', '03']);
  });
});
