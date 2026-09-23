import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
  template: `<div [appTurnGesture]="scene()" (spun)="spins = spins + 1"></div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  public readonly scene = signal<TurnableScene | null>(null);
  public spins = 0;
}

const pointer = (
  target: EventTarget,
  type: string,
  options: { x?: number; y?: number; button?: number } = {},
): void => {
  target.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      clientX: options.x ?? 0,
      clientY: options.y ?? 0,
      button: options.button ?? 0,
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
  return { fixture, host, spins: () => fixture.componentInstance.spins };
};

describe('TurnGestureDirective', () => {
  afterEach(() => {
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

  it('reports a spin when the release ends a drag, and not after a click', async () => {
    const scene = new SceneDouble();
    const { host, spins } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    expect(spins()).toBe(0);

    scene.isDrag = true;
    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');
    expect(spins()).toBe(1);
    expect(scene.releases).toBe(2);
  });

  it('lets go on a cancelled pointer too', async () => {
    const scene = new SceneDouble();
    scene.isDrag = true;
    const { host, spins } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointercancel');

    expect(spins()).toBe(1);
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
    ['a planet', 'button', { 'data-object-body': '' }],
    ['a link', 'a', {}],
    ['a field', 'input', {}],
    ['a text area', 'textarea', {}],
    ['a select', 'select', {}],
  ])(
    'leaves what already has a gesture to it: %s',
    async (_name, tag, attributes: Record<string, string>) => {
      const scene = new SceneDouble();
      scene.isDrag = true;
      const { spins } = await mount(scene);
      const element = document.createElement(tag);
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      const child = document.createElement('span');
      element.append(child);
      document.body.append(element);

      pointer(child, 'pointerdown');
      pointer(child, 'pointerup');

      expect(scene.grabs).toEqual([]);
      expect(spins()).toBe(0);
    },
  );

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
    const { host, spins } = await mount(scene);

    pointer(host, 'pointerdown');
    pointer(host, 'pointermove', { x: 30, y: 30 });
    pointer(host, 'pointerup');

    expect(scene.turns).toEqual([]);
    expect(spins()).toBe(0);
    expect(document.body.style.cursor).toBe('');
  });

  it('does nothing before a scene is there', async () => {
    const { host, spins } = await mount(null);

    pointer(host, 'pointerdown');
    pointer(host, 'pointerup');

    expect(spins()).toBe(0);
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
