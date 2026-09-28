import { TestBed } from '@angular/core/testing';
import { ClickAbsorberService } from '../services/click-absorber.service';
import { ZoomGestureTracker } from './zoom-gesture.tracker';
import {
  LookableSceneDouble,
  windowEvents,
} from '@testing/doubles/scene-look.double';
import {
  firePointer,
  HeardClicks,
  heardClicks,
  PointerAt,
  tap as tapOn,
} from '@testing/fixtures/pointer.fixture';

const trackers: ZoomGestureTracker[] = [];

let clicks: HeardClicks;

const tap = (target: EventTarget, finger: PointerAt = {}): void => {
  tapOn(target, finger, { at: (finger.at ?? 0) + 60 });
};

const mount = async (scene: LookableSceneDouble) => {
  const absorber = TestBed.inject(ClickAbsorberService);
  const tracker = new ZoomGestureTracker(scene, windowEvents, absorber);
  trackers.push(tracker);
  const host = document.createElement('div');
  document.body.append(host);
  await Promise.resolve();
  return { tracker, host, clicks: clicks.count };
};

const planetButton = (): HTMLElement => {
  const planet = document.createElement('button');
  planet.dataset['sceneTarget'] = '';
  document.body.append(planet);
  return planet;
};

const pinch = (host: HTMLElement): void => {
  firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
  firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
  firePointer(host, 'pointermove', { id: 1, x: 80, y: 200 });
  firePointer(host, 'pointermove', { id: 2, x: 160, y: 200 });
  firePointer(host, 'pointerup', { id: 1, x: 80, y: 200 });
  firePointer(host, 'pointerup', { id: 2, x: 160, y: 200 });
};

describe('ZoomGestureTracker', () => {
  beforeEach(() => {
    clicks = heardClicks();
  });

  afterEach(() => {
    clicks.stop();
    for (const tracker of trackers.splice(0)) {
      tracker.stop();
    }
    TestBed.resetTestingModule();
    document.body.replaceChildren();
  });

  it('holds the zoom between two fingers and stretches it as they spread', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    expect(scene.holds).toEqual([]);
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointermove', { id: 1, x: 80, y: 200 });
    firePointer(host, 'pointermove', { id: 2, x: 160, y: 200 });

    expect(scene.holds).toEqual([[120, 200]]);
    expect(scene.stretches).toEqual([
      [110, 200, 1.5],
      [120, 200, 2],
    ]);
    expect(scene.releases).toBe(0);

    firePointer(host, 'pointerup', { id: 2, x: 160, y: 200 });
    expect(scene.releases).toBe(1);
  });

  it('stretches no more once one finger lifted', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointerup', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointermove', { id: 1, x: 60, y: 200 });

    expect(scene.stretches).toEqual([]);
    expect(scene.releases).toBe(1);
  });

  it('absorbs the click that follows a pinch, and not the next one', async () => {
    const { host, clicks } = await mount(new LookableSceneDouble());

    pinch(host);
    firePointer(host, 'click');
    expect(clicks()).toBe(0);

    firePointer(host, 'click');
    expect(clicks()).toBe(1);
  });

  it('absorbs nothing after a tap', async () => {
    const { host, clicks } = await mount(new LookableSceneDouble());

    tap(host);
    firePointer(host, 'click');

    expect(clicks()).toBe(1);
  });

  it('looks closer on a double tap, once', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, at: 0 });
    expect(scene.looks).toBe(0);
    tap(host, { x: 54, y: 52, at: 200 });
    expect(scene.looks).toBe(1);
    tap(host, { x: 54, y: 52, at: 400 });
    expect(scene.looks).toBe(1);
    tap(host, { x: 54, y: 52, at: 600 });
    expect(scene.looks).toBe(2);
  });

  it.each([
    ['too slow', { x: 50, y: 50, at: 700 }],
    ['too far', { x: 150, y: 50, at: 200 }],
  ])('does not take two taps %s for a double tap', async (_name, second) => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, at: 0 });
    tap(host, second);

    expect(scene.looks).toBe(0);
  });

  it('does not take a slide for a tap', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, at: 0 });
    firePointer(host, 'pointerdown', { x: 50, y: 50, at: 200 });
    firePointer(host, 'pointermove', { x: 70, y: 50, at: 220 });
    firePointer(host, 'pointerup', { x: 70, y: 50, at: 240 });

    expect(scene.looks).toBe(0);
  });

  it('takes no tap from a pinch', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200, at: 0 });
    firePointer(host, 'pointerdown', { id: 2, x: 104, y: 200, at: 10 });
    firePointer(host, 'pointerup', { id: 2, x: 104, y: 200, at: 40 });
    firePointer(host, 'pointerup', { id: 1, x: 100, y: 200, at: 50 });
    tap(host, { x: 100, y: 200, at: 150 });

    expect(scene.looks).toBe(0);
  });

  it.each([
    ['a panel', 'div', { 'data-panel': '' }],
    ['a link', 'a', {}],
    ['a field', 'input', {}],
  ])(
    'leaves what already has a gesture to it: %s',
    async (_name, tag, attributes: Record<string, string>) => {
      const scene = new LookableSceneDouble();
      await mount(scene);
      const element = document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      document.body.append(element);

      pinch(element);
      tap(element, { at: 0 });
      tap(element, { at: 100 });

      expect(scene.holds).toEqual([]);
      expect(scene.looks).toBe(0);
    },
  );

  it('pinches with a finger on a planet and one on the sky, and swallows the planet’s click', async () => {
    const scene = new LookableSceneDouble();
    const { host, clicks } = await mount(scene);
    const planet = planetButton();

    firePointer(planet, 'pointerdown', { id: 1, x: 100, y: 200 });
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(planet, 'pointermove', { id: 1, x: 80, y: 200 });
    firePointer(host, 'pointermove', { id: 2, x: 160, y: 200 });
    firePointer(planet, 'pointerup', { id: 1, x: 80, y: 200 });
    firePointer(host, 'pointerup', { id: 2, x: 160, y: 200 });
    firePointer(planet, 'click');

    expect(scene.holds).toEqual([[120, 200]]);
    expect(scene.stretches.at(-1)).toEqual([120, 200, 2]);
    expect(clicks()).toBe(0);
  });

  it('pinches with both fingers on planets', async () => {
    const scene = new LookableSceneDouble();
    await mount(scene);

    pinch(planetButton());

    expect(scene.holds).toEqual([[120, 200]]);
  });

  it('leaves a tap on a planet to the planet, and never takes it for a double tap', async () => {
    const scene = new LookableSceneDouble();
    const { clicks } = await mount(scene);
    const planet = planetButton();

    tap(planet, { at: 0 });
    firePointer(planet, 'click');
    tap(planet, { at: 100 });
    firePointer(planet, 'click');

    expect(clicks()).toBe(2);
    expect(scene.looks).toBe(0);
    expect(scene.holds).toEqual([]);
  });

  it('pinches with a finger on a figure of the about view, and leaves its taps to the figure', async () => {
    const scene = new LookableSceneDouble();
    const { host, clicks } = await mount(scene);
    const figure = document.createElement('button');
    figure.dataset['sceneFigure'] = '';
    document.body.append(figure);

    tap(figure, { at: 0 });
    firePointer(figure, 'click');
    tap(figure, { at: 100 });
    firePointer(figure, 'click');
    firePointer(figure, 'pointerdown', { id: 1, x: 100, y: 200, at: 1000 });
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200, at: 1000 });
    firePointer(figure, 'pointermove', { id: 1, x: 80, y: 200, at: 1050 });
    firePointer(host, 'pointermove', { id: 2, x: 160, y: 200, at: 1050 });
    firePointer(figure, 'pointerup', { id: 1, x: 80, y: 200, at: 1100 });
    firePointer(host, 'pointerup', { id: 2, x: 160, y: 200, at: 1100 });
    firePointer(figure, 'click');

    expect(scene.holds).toEqual([[120, 200]]);
    expect(scene.looks).toBe(0);
    expect(clicks()).toBe(2);
  });

  it('answers the fingers only', async () => {
    const scene = new LookableSceneDouble();
    const { host } = await mount(scene);

    firePointer(host, 'pointerdown', { id: 1, kind: 'mouse' });
    firePointer(host, 'pointerdown', { id: 2, kind: 'pen' });

    expect(scene.holds).toEqual([]);
  });

  it('stops listening when stopped', async () => {
    const scene = new LookableSceneDouble();
    const { host, tracker } = await mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    tracker.stop();
    firePointer(document.body, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(document.body, 'pointermove', { id: 2, x: 180, y: 200 });

    expect(scene.holds).toEqual([]);
    expect(scene.stretches).toEqual([]);
  });
});
