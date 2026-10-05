import { SkyLookTracker } from './sky-look.tracker';
import {
  LookableSceneDouble,
  windowEvents,
} from '@testing/doubles/scene-look.double';

const PIXELS = 0;
const MIDDLE = 1;
const MIDDLE_PRESSED = 4;

const roll = (
  target: EventTarget,
  deltaY: number,
  change: WheelEventInit = {},
): WheelEvent => {
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: 300,
    clientY: 200,
    deltaY,
    deltaMode: PIXELS,
    ...change,
  });
  target.dispatchEvent(event);
  return event;
};

interface Press {
  readonly x: number;
  readonly y: number;
  readonly button?: number;
  readonly buttons?: number;
}

const mouse = (
  target: EventTarget,
  type: 'mousedown' | 'mousemove' | 'mouseup',
  { x, y, button = MIDDLE, buttons }: Press,
): MouseEvent => {
  const pressed = button === MIDDLE && type !== 'mouseup' ? MIDDLE_PRESSED : 0;
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button,
    buttons: buttons ?? pressed,
  });
  target.dispatchEvent(event);
  return event;
};

describe('SkyLookTracker', () => {
  let sky: HTMLElement;
  let panel: HTMLElement;
  let scene: LookableSceneDouble;
  let tracker: SkyLookTracker;

  beforeEach(() => {
    sky = document.createElement('canvas');
    panel = document.createElement('section');
    panel.dataset['panel'] = 'window';
    panel.append(document.createElement('p'));
    document.body.append(sky, panel);
    scene = new LookableSceneDouble();
    tracker = new SkyLookTracker(scene, windowEvents);
  });

  afterEach(() => {
    tracker.stop();
    sky.remove();
    panel.remove();
  });

  it('zooms about the pointer by a tenth per notch of the wheel on the sky', () => {
    const event = roll(sky, -100);

    expect(event.defaultPrevented).toBe(true);
    expect(scene.holds).toEqual([[300, 200]]);
    expect(scene.stretches).toHaveLength(1);
    expect(scene.stretches[0]?.[2]).toBeCloseTo(1.1, 12);
    expect(scene.releases).toBe(1);
  });

  it('leaves the wheel to a window, which scrolls', () => {
    const event = roll(panel.firstElementChild ?? panel, -100);

    expect(event.defaultPrevented).toBe(false);
    expect(scene.holds).toEqual([]);
  });

  it('moves the camera with the pointer while the middle button is pressed on the sky', () => {
    const press = mouse(sky, 'mousedown', { x: 100, y: 100 });
    mouse(sky, 'mousemove', { x: 130, y: 90 });
    mouse(sky, 'mousemove', { x: 150, y: 120 });
    mouse(sky, 'mouseup', { x: 150, y: 120 });
    mouse(sky, 'mousemove', { x: 400, y: 400 });

    expect(press.defaultPrevented).toBe(true);
    expect(tracker.pan.x).toBe(50);
    expect(tracker.pan.y).toBe(20);
    expect(scene.requests).toBe(2);
  });

  it('zooms about the point seen under the pointer once the camera has moved', () => {
    mouse(sky, 'mousedown', { x: 100, y: 100 });
    mouse(sky, 'mousemove', { x: 60, y: 130 });
    mouse(sky, 'mouseup', { x: 60, y: 130 });

    roll(sky, -100);

    expect(scene.holds).toEqual([[340, 170]]);
  });

  it('forgets a drag whose middle button came up outside the window', () => {
    mouse(sky, 'mousedown', { x: 100, y: 100 });
    mouse(sky, 'mousemove', { x: 120, y: 100, button: MIDDLE, buttons: 0 });
    mouse(sky, 'mousemove', { x: 160, y: 100 });

    expect(tracker.pan.x).toBe(0);
  });

  it('does nothing for a middle click without a drag', () => {
    mouse(sky, 'mousedown', { x: 100, y: 100 });
    mouse(sky, 'mouseup', { x: 100, y: 100 });

    expect(tracker.pan.x).toBe(0);
    expect(scene.requests).toBe(0);
  });

  it('leaves the middle button to a window, and ignores the other buttons', () => {
    const press = mouse(panel, 'mousedown', { x: 100, y: 100 });
    mouse(panel, 'mousemove', { x: 160, y: 100 });
    mouse(panel, 'mouseup', { x: 160, y: 100 });
    const left = mouse(sky, 'mousedown', { x: 100, y: 100, button: 0 });
    mouse(sky, 'mousemove', { x: 160, y: 100, button: 0 });

    expect(press.defaultPrevented).toBe(false);
    expect(left.defaultPrevented).toBe(false);
    expect(tracker.pan.x).toBe(0);
  });

  it('stops listening', () => {
    tracker.stop();
    const event = roll(sky, -100);

    expect(event.defaultPrevented).toBe(false);
    expect(scene.holds).toEqual([]);
  });
});
