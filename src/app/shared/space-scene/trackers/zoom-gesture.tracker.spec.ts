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

const mount = (scene: LookableSceneDouble) => {
  const absorber = TestBed.inject(ClickAbsorberService);
  const tracker = new ZoomGestureTracker(scene, windowEvents, absorber);
  trackers.push(tracker);
  const host = document.createElement('div');
  document.body.append(host);
  return { tracker, host, clicks: clicks.count };
};

const sceneButton = (key: 'sceneTarget' | 'sceneFigure'): HTMLElement => {
  const button = document.createElement('button');
  button.dataset[key] = '';
  document.body.append(button);
  return button;
};

const TARGETS = [
  { name: 'planet', make: () => sceneButton('sceneTarget') },
  { name: 'figure', make: () => sceneButton('sceneFigure') },
];

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

  it('holds the zoom between two fingers and stretches it as they spread', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

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

  it('stretches no more once one finger lifted', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointerup', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointermove', { id: 1, x: 60, y: 200 });

    expect(scene.stretches).toEqual([]);
    expect(scene.releases).toBe(1);
  });

  it('absorbs the click that follows a pinch, and not the next one', () => {
    const { host, clicks } = mount(new LookableSceneDouble());

    pinch(host);
    firePointer(host, 'click');
    expect(clicks()).toBe(0);

    firePointer(host, 'click');
    expect(clicks()).toBe(1);
  });

  it('absorbs nothing after a tap', () => {
    const { host, clicks } = mount(new LookableSceneDouble());

    tap(host);
    firePointer(host, 'click');

    expect(clicks()).toBe(1);
  });

  it('looks closer on a double tap, once', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

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
  ])('does not take two taps %s for a double tap', (_name, second) => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

    tap(host, { x: 50, y: 50, at: 0 });
    tap(host, second);

    expect(scene.looks).toBe(0);
  });

  it('does not take a slide for a tap', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

    tap(host, { x: 50, y: 50, at: 0 });
    firePointer(host, 'pointerdown', { x: 50, y: 50, at: 200 });
    firePointer(host, 'pointermove', { x: 70, y: 50, at: 220 });
    firePointer(host, 'pointerup', { x: 70, y: 50, at: 240 });

    expect(scene.looks).toBe(0);
  });

  it('takes no tap from a pinch', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

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
    (_name, tag, attributes: Record<string, string>) => {
      const scene = new LookableSceneDouble();
      mount(scene);
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

  it.each(TARGETS)(
    'pinches with a finger on a $name and one on the sky, and swallows the $name’s click',
    ({ make }) => {
      const scene = new LookableSceneDouble();
      const { host, clicks } = mount(scene);
      const target = make();

      firePointer(target, 'pointerdown', { id: 1, x: 100, y: 200 });
      firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
      firePointer(target, 'pointermove', { id: 1, x: 80, y: 200 });
      firePointer(host, 'pointermove', { id: 2, x: 160, y: 200 });
      firePointer(target, 'pointerup', { id: 1, x: 80, y: 200 });
      firePointer(host, 'pointerup', { id: 2, x: 160, y: 200 });
      firePointer(target, 'click');

      expect(scene.holds).toEqual([[120, 200]]);
      expect(scene.stretches.at(-1)).toEqual([120, 200, 2]);
      expect(clicks()).toBe(0);
    },
  );

  it.each(TARGETS)(
    'leaves a tap on a $name to the $name, and never takes it for a double tap',
    ({ make }) => {
      const scene = new LookableSceneDouble();
      const { clicks } = mount(scene);
      const target = make();

      tap(target, { at: 0 });
      firePointer(target, 'click');
      tap(target, { at: 100 });
      firePointer(target, 'click');

      expect(clicks()).toBe(2);
      expect(scene.looks).toBe(0);
      expect(scene.holds).toEqual([]);
    },
  );

  it('pinches with both fingers on planets', () => {
    const scene = new LookableSceneDouble();
    mount(scene);

    pinch(sceneButton('sceneTarget'));

    expect(scene.holds).toEqual([[120, 200]]);
  });

  it('lets go of the pinch when a finger is cancelled, and takes a cancelled touch for no tap', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    firePointer(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(host, 'pointercancel', { id: 2, x: 140, y: 200 });
    expect(scene.releases).toBe(1);
    firePointer(host, 'pointercancel', { id: 1, x: 100, y: 200 });

    tap(host, { x: 50, y: 50, at: 1000 });
    firePointer(host, 'pointerdown', { x: 50, y: 50, at: 1200 });
    firePointer(host, 'pointercancel', { x: 50, y: 50, at: 1230 });

    expect(scene.looks).toBe(0);
  });

  it('answers the fingers only', () => {
    const scene = new LookableSceneDouble();
    const { host } = mount(scene);

    firePointer(host, 'pointerdown', { id: 1, kind: 'mouse' });
    firePointer(host, 'pointerdown', { id: 2, kind: 'pen' });

    expect(scene.holds).toEqual([]);
  });

  it('stops listening when stopped', () => {
    const scene = new LookableSceneDouble();
    const { host, tracker } = mount(scene);

    firePointer(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    tracker.stop();
    firePointer(document.body, 'pointerdown', { id: 2, x: 140, y: 200 });
    firePointer(document.body, 'pointermove', { id: 2, x: 180, y: 200 });

    expect(scene.holds).toEqual([]);
    expect(scene.stretches).toEqual([]);
  });
});
