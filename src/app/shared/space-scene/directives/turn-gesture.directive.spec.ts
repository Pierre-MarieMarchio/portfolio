import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TurnGestureDirective, TurnableScene } from './turn-gesture.directive';

class SceneDouble implements TurnableScene {
  public isTurnable = true;
  public isDrag = false;
  public readonly grabs: [number, number][] = [];
  public readonly turns: [number, number][] = [];
  public releases = 0;

  public grab(clientX: number, clientY: number): boolean {
    this.grabs.push([clientX, clientY]);
    return this.isTurnable;
  }

  public turn(clientX: number, clientY: number): void {
    this.turns.push([clientX, clientY]);
  }

  public release(): boolean {
    this.releases += 1;
    return this.isDrag;
  }
}

@Component({
  imports: [TurnGestureDirective],
  template: `<div [appTurnGesture]="scene()"></div>`,
})
class HostComponent {
  public readonly scene = signal<TurnableScene | null>(null);
}

let clicksHeard = 0;

const hearClick = (): void => {
  clicksHeard += 1;
};

const pointer = (
  target: EventTarget,
  type: string,
  options: {
    x?: number;
    y?: number;
    button?: number;
    id?: number;
    isPrimary?: boolean;
  } = {},
): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      clientX: options.x ?? 0,
      clientY: options.y ?? 0,
      button: options.button ?? 0,
      pointerId: options.id ?? 1,
      isPrimary: options.isPrimary ?? true,
    }),
  );
};

const mount = async (scene: TurnableScene | null) => {
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.scene.set(scene);
  await fixture.whenStable();
  const host = fixture.nativeElement as HTMLElement;
  document.body.append(host);
  return { fixture, host, clicks: () => clicksHeard };
};

describe('TurnGestureDirective', () => {
  beforeEach(() => {
    clicksHeard = 0;
    document.addEventListener('click', hearClick);
  });

  afterEach(() => {
    document.removeEventListener('click', hearClick);
    TestBed.resetTestingModule();
    document.body.replaceChildren();
    document.body.style.cursor = '';
  });

  it('grabs the scene where the pointer goes down and turns it with the hand', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    pointer(host, 'pointerdown', { x: 10, y: 20 });
    pointer(host, 'pointermove', { x: 30, y: 25 });
    pointer(host, 'pointermove', { x: 40, y: 28 });

    expect(scene.grabs).toEqual([[10, 20]]);
    expect(scene.turns).toEqual([
      [30, 25],
      [40, 28],
    ]);
  });

  it('absorbs the click that ends a drag, and not the one that ends a click', async () => {
    const scene = new SceneDouble();
    const { host, clicks } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    pointer(host, 'click');
    expect(clicks()).toBe(1);

    scene.isDrag = true;
    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    pointer(host, 'click');
    expect(clicks()).toBe(1);
    expect(scene.releases).toBe(2);

    pointer(host, 'click');
    expect(clicks()).toBe(2);
  });

  it('absorbs nothing once the next press began', async () => {
    const scene = new SceneDouble();
    scene.isDrag = true;
    const { host, clicks } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    scene.isTurnable = false;
    pointer(host, 'pointerdown');
    pointer(host, 'click');

    expect(clicks()).toBe(1);
  });

  it('lets go on a cancelled pointer too', async () => {
    const scene = new SceneDouble();
    scene.isDrag = true;
    const { host, clicks } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointercancel');
    pointer(host, 'click');

    expect(clicks()).toBe(0);
  });

  it('stops following the hand once it let go', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    pointer(host, 'pointermove', { x: 50, y: 50 });
    pointer(host, 'pointerup');

    expect(scene.turns).toEqual([]);
    expect(scene.releases).toBe(1);
  });

  it('shows the grabbing cursor while the scene is held', async () => {
    const { host } = await mount(new SceneDouble());

    pointer(host, 'pointerdown');
    expect(document.body.style.cursor).toBe('grabbing');

    pointer(host, 'pointerup');
    expect(document.body.style.cursor).toBe('');
  });

  it.each([
    ['a panel', 'div', { 'data-panel': '' }],
    ['a scene target', 'button', { 'data-scene-target': '' }],
    ['a link', 'a', {}],
    ['a field', 'input', {}],
    ['a text area', 'textarea', {}],
    ['a select', 'select', {}],
  ])(
    'leaves what already has a gesture to it: %s',
    async (_name, tag, attributes: Record<string, string>) => {
      const scene = new SceneDouble();
      scene.isDrag = true;
      const { clicks } = await mount(scene);
      const element = document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      const child = document.createElement('span');
      element.append(child);
      document.body.append(element);

      pointer(child, 'pointerdown');
      pointer(child, 'pointerup');
      pointer(child, 'click');

      expect(scene.grabs).toEqual([]);
      expect(clicks()).toBe(1);
    },
  );

  it('never turns with a second finger, nor lets go when it lifts', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    pointer(host, 'pointerdown', { x: 10, y: 20, id: 1 });
    pointer(host, 'pointerdown', { x: 60, y: 20, id: 2, isPrimary: false });
    pointer(host, 'pointermove', { x: 80, y: 30, id: 2, isPrimary: false });
    pointer(host, 'pointerup', { x: 80, y: 30, id: 2, isPrimary: false });
    pointer(host, 'pointermove', { x: 12, y: 24, id: 1 });

    expect(scene.grabs).toEqual([[10, 20]]);
    expect(scene.turns).toEqual([[12, 24]]);
    expect(scene.releases).toBe(0);
  });

  it('answers the main button only', async () => {
    const scene = new SceneDouble();
    const { host } = await mount(scene);

    pointer(host, 'pointerdown', { button: 2 });

    expect(scene.grabs).toEqual([]);
  });

  it('holds nothing when the scene refuses the grab', async () => {
    const scene = new SceneDouble();
    scene.isTurnable = false;
    scene.isDrag = true;
    const { host, clicks } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointermove', { x: 30, y: 30 });
    pointer(host, 'pointerup');
    pointer(host, 'click');

    expect(scene.turns).toEqual([]);
    expect(clicks()).toBe(1);
    expect(document.body.style.cursor).toBe('');
  });

  it('does nothing before a scene is there', async () => {
    const { host, clicks } = await mount(null);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    pointer(host, 'click');

    expect(clicks()).toBe(1);
    expect(document.body.style.cursor).toBe('');
  });

  it('lets go of a held scene and stops listening when destroyed', async () => {
    const scene = new SceneDouble();
    const { host, fixture } = await mount(scene);

    pointer(host, 'pointerdown');
    fixture.destroy();
    pointer(document.body, 'pointermove', { x: 30, y: 30 });
    pointer(document.body, 'pointerdown');

    expect(scene.turns).toEqual([]);
    expect(scene.grabs).toHaveLength(1);
    expect(document.body.style.cursor).toBe('');
  });
});
