import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DisplayFormatService } from '@app/core/services';
import type { DisplayFormat } from '@app/core/models';
import { ZoomGestureDirective, ZoomableScene } from './zoom-gesture.directive';

class SceneDouble implements ZoomableScene {
  public canLook = true;
  public readonly holds: [number, number][] = [];
  public readonly stretches: [number, number, number][] = [];
  public releases = 0;
  public looks = 0;

  public holdZoom(clientX: number, clientY: number): boolean {
    this.holds.push([clientX, clientY]);
    return true;
  }

  public stretchZoom(clientX: number, clientY: number, ratio: number): void {
    this.stretches.push([clientX, clientY, ratio]);
  }

  public releaseZoom(): void {
    this.releases += 1;
  }

  public lookCloser(): boolean {
    this.looks += 1;
    return this.canLook;
  }
}

@Component({
  imports: [ZoomGestureDirective],
  template: `<div [appZoomGesture]="scene()"></div>`,
})
class HostComponent {
  public readonly scene = signal<ZoomableScene | null>(null);
}

interface Finger {
  readonly id?: number;
  readonly x?: number;
  readonly y?: number;
  readonly time?: number;
  readonly type?: string;
}

let clicksHeard = 0;

const hearClick = (): void => {
  clicksHeard += 1;
};

const touch = (
  target: EventTarget,
  type: string,
  finger: Finger = {},
): void => {
  const event = new PointerEvent(type, {
    bubbles: true,
    clientX: finger.x ?? 0,
    clientY: finger.y ?? 0,
    pointerId: finger.id ?? 1,
    isPrimary: (finger.id ?? 1) === 1,
    pointerType: finger.type ?? 'touch',
  });
  Object.defineProperty(event, 'timeStamp', { value: finger.time ?? 0 });
  target.dispatchEvent(event);
};

const tap = (target: EventTarget, finger: Finger = {}): void => {
  touch(target, 'pointerdown', finger);
  touch(target, 'pointerup', { ...finger, time: (finger.time ?? 0) + 60 });
};

const mount = async (
  scene: ZoomableScene | null,
  format: DisplayFormat = 'phone',
) => {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: DisplayFormatService, useValue: { format: () => format } },
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.scene.set(scene);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  return { fixture, host, clicks: () => clicksHeard };
};

const planetButton = (): HTMLElement => {
  const planet = document.createElement('button');
  planet.dataset['sceneTarget'] = '';
  document.body.append(planet);
  return planet;
};

const pinch = (host: HTMLElement): void => {
  touch(host, 'pointerdown', { id: 1, x: 100, y: 200 });
  touch(host, 'pointerdown', { id: 2, x: 140, y: 200 });
  touch(host, 'pointermove', { id: 1, x: 80, y: 200 });
  touch(host, 'pointermove', { id: 2, x: 160, y: 200 });
  touch(host, 'pointerup', { id: 1, x: 80, y: 200 });
  touch(host, 'pointerup', { id: 2, x: 160, y: 200 });
};

describe('ZoomGestureDirective', () => {
  beforeEach(() => {
    clicksHeard = 0;
    document.addEventListener('click', hearClick);
  });

  afterEach(() => {
    document.removeEventListener('click', hearClick);
    TestBed.resetTestingModule();
    document.body.replaceChildren();
  });

  it('holds the zoom between two fingers and stretches it as they spread', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    touch(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    expect(scene.holds).toEqual([]);
    touch(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    touch(host, 'pointermove', { id: 1, x: 80, y: 200 });
    touch(host, 'pointermove', { id: 2, x: 160, y: 200 });

    expect(scene.holds).toEqual([[120, 200]]);
    expect(scene.stretches).toEqual([
      [110, 200, 1.5],
      [120, 200, 2],
    ]);
    expect(scene.releases).toBe(0);

    touch(host, 'pointerup', { id: 2, x: 160, y: 200 });
    expect(scene.releases).toBe(1);
  });

  it('stretches no more once one finger lifted', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    touch(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    touch(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    touch(host, 'pointerup', { id: 2, x: 140, y: 200 });
    touch(host, 'pointermove', { id: 1, x: 60, y: 200 });

    expect(scene.stretches).toEqual([]);
    expect(scene.releases).toBe(1);
  });

  it('absorbs the click that follows a pinch, and not the next one', async () => {
    const { host, clicks } = await mount(new SceneDouble());

    pinch(host);
    touch(host, 'click');
    expect(clicks()).toBe(0);

    touch(host, 'click');
    expect(clicks()).toBe(1);
  });

  it('absorbs nothing after a tap', async () => {
    const { host, clicks } = await mount(new SceneDouble());

    tap(host);
    touch(host, 'click');

    expect(clicks()).toBe(1);
  });

  it('looks closer on a double tap, once', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, time: 0 });
    expect(scene.looks).toBe(0);
    tap(host, { x: 54, y: 52, time: 200 });
    expect(scene.looks).toBe(1);
    tap(host, { x: 54, y: 52, time: 400 });
    expect(scene.looks).toBe(1);
    tap(host, { x: 54, y: 52, time: 600 });
    expect(scene.looks).toBe(2);
  });

  it.each([
    ['too slow', { x: 50, y: 50, time: 700 }],
    ['too far', { x: 150, y: 50, time: 200 }],
  ])('does not take two taps %s for a double tap', async (_name, second) => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, time: 0 });
    tap(host, second);

    expect(scene.looks).toBe(0);
  });

  it('does not take a slide for a tap', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    tap(host, { x: 50, y: 50, time: 0 });
    touch(host, 'pointerdown', { x: 50, y: 50, time: 200 });
    touch(host, 'pointermove', { x: 70, y: 50, time: 220 });
    touch(host, 'pointerup', { x: 70, y: 50, time: 240 });

    expect(scene.looks).toBe(0);
  });

  it('takes no tap from a pinch', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    touch(host, 'pointerdown', { id: 1, x: 100, y: 200, time: 0 });
    touch(host, 'pointerdown', { id: 2, x: 104, y: 200, time: 10 });
    touch(host, 'pointerup', { id: 2, x: 104, y: 200, time: 40 });
    touch(host, 'pointerup', { id: 1, x: 100, y: 200, time: 50 });
    tap(host, { x: 100, y: 200, time: 150 });

    expect(scene.looks).toBe(0);
  });

  it.each([
    ['a panel', 'div', { 'data-panel': '' }],
    ['a link', 'a', {}],
    ['a field', 'input', {}],
  ])(
    'leaves what already has a gesture to it: %s',
    async (_name, tag, attributes: Record<string, string>) => {
      const scene = new SceneDouble();
      await mount(scene);
      const element = document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      document.body.append(element);

      pinch(element);
      tap(element, { time: 0 });
      tap(element, { time: 100 });

      expect(scene.holds).toEqual([]);
      expect(scene.looks).toBe(0);
    },
  );

  it('pinches with a finger on a planet and one on the sky, and swallows the planet’s click', async () => {
    const scene = new SceneDouble();
    const { host, clicks } = await mount(scene);
    const planet = planetButton();

    touch(planet, 'pointerdown', { id: 1, x: 100, y: 200 });
    touch(host, 'pointerdown', { id: 2, x: 140, y: 200 });
    touch(planet, 'pointermove', { id: 1, x: 80, y: 200 });
    touch(host, 'pointermove', { id: 2, x: 160, y: 200 });
    touch(planet, 'pointerup', { id: 1, x: 80, y: 200 });
    touch(host, 'pointerup', { id: 2, x: 160, y: 200 });
    touch(planet, 'click');

    expect(scene.holds).toEqual([[120, 200]]);
    expect(scene.stretches.at(-1)).toEqual([120, 200, 2]);
    expect(clicks()).toBe(0);
  });

  it('pinches with both fingers on planets', async () => {
    const scene = new SceneDouble();
    await mount(scene);

    pinch(planetButton());

    expect(scene.holds).toEqual([[120, 200]]);
  });

  it('leaves a tap on a planet to the planet, and never takes it for a double tap', async () => {
    const scene = new SceneDouble();
    const { clicks } = await mount(scene);
    const planet = planetButton();

    tap(planet, { time: 0 });
    touch(planet, 'click');
    tap(planet, { time: 100 });
    touch(planet, 'click');

    expect(clicks()).toBe(2);
    expect(scene.looks).toBe(0);
    expect(scene.holds).toEqual([]);
  });

  it('answers the fingers only', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    touch(host, 'pointerdown', { id: 1, type: 'mouse' });
    touch(host, 'pointerdown', { id: 2, type: 'pen' });

    expect(scene.holds).toEqual([]);
  });

  it('leaves the desktop as it was', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene, 'desktop');

    pinch(host);
    tap(host, { time: 0 });
    tap(host, { time: 100 });

    expect(scene.holds).toEqual([]);
    expect(scene.looks).toBe(0);
  });

  it('does nothing before a scene is there', async () => {
    const { host, clicks } = await mount(null);

    pinch(host);
    touch(host, 'click');

    expect(clicks()).toBe(1);
  });

  it('stops listening when destroyed', async () => {
    const scene = new SceneDouble();
    const { host, fixture } = await mount(scene);

    touch(host, 'pointerdown', { id: 1, x: 100, y: 200 });
    fixture.destroy();
    touch(document.body, 'pointerdown', { id: 2, x: 140, y: 200 });
    touch(document.body, 'pointermove', { id: 2, x: 180, y: 200 });

    expect(scene.holds).toEqual([]);
    expect(scene.stretches).toEqual([]);
  });
});
